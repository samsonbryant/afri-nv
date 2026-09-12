from __future__ import annotations

from uuid import UUID

from django.http import HttpResponse
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.application.documents import render_payment_pdf
from apps.billing.infrastructure.dependencies import get_billing_service
from apps.billing.infrastructure.models import Invoice
from apps.billing.interfaces.serializers.serializers import (
    AttachCardSerializer,
    CheckoutSerializer,
    CouponValidateSerializer,
    InvoiceSerializer,
    ManualPaymentCreateSerializer,
    ManualPaymentSubmitSerializer,
    PlanSerializer,
    PortalSerializer,
    RefundSerializer,
    SubscriptionSerializer,
    UsageSerializer,
)
from apps.core.domain.exceptions import ValidationError
from apps.organizations.infrastructure.models import Membership


def _require_org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class PlanListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["billing"])
    def get(self, request: Request) -> Response:
        return Response(PlanSerializer(get_billing_service().list_plans(), many=True).data)


class SubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["billing"])
    def get(self, request: Request) -> Response:
        sub = get_billing_service().get_subscription(request.user.id, _require_org(request))
        if sub is None:
            return Response({"subscription": None})
        return Response(SubscriptionSerializer(sub).data)


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=CheckoutSerializer, tags=["billing"])
    def post(self, request: Request) -> Response:
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        result = get_billing_service().checkout(
            request.user.id,
            data["organization_id"],
            data["plan_code"],
            data.get("coupon") or None,
        )
        return Response(result, status=status.HTTP_201_CREATED)


class AttachCardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=AttachCardSerializer, tags=["billing"])
    def post(self, request: Request) -> Response:
        serializer = AttachCardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        sub = get_billing_service().attach_card(
            request.user.id,
            data["organization_id"],
            payment_method_ref=data["payment_method_ref"],
            card_last4=data.get("card_last4") or "",
            card_brand=data.get("card_brand") or "",
            plan_code=data.get("plan_code") or None,
        )
        return Response(SubscriptionSerializer(sub).data)


class PortalView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=PortalSerializer, tags=["billing"])
    def post(self, request: Request) -> Response:
        serializer = PortalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            get_billing_service().portal(
                request.user.id, serializer.validated_data["organization_id"]
            )
        )


class InvoiceListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["billing"])
    def get(self, request: Request) -> Response:
        items = get_billing_service().list_invoices(request.user.id, _require_org(request))
        return Response(InvoiceSerializer(items, many=True).data)


class InvoiceDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["billing"])
    def get(self, request: Request, invoice_id: UUID, kind: str) -> HttpResponse:
        if kind not in {"invoice", "receipt"}:
            raise ValidationError("Document type must be invoice or receipt.")
        try:
            invoice = Invoice.objects.select_related("organization", "subscription__plan").get(
                pk=invoice_id
            )
        except Invoice.DoesNotExist as exc:
            from apps.billing.domain.exceptions import InvoiceNotFoundError

            raise InvoiceNotFoundError() from exc
        allowed = (
            request.user.is_staff
            or Membership.objects.filter(
                user_id=request.user.id, organization_id=invoice.organization_id
            ).exists()
        )
        if not allowed:
            from apps.core.domain.exceptions import PermissionDeniedError

            raise PermissionDeniedError("You cannot access this payment document.")
        number = invoice.number if kind == "invoice" else invoice.receipt_number
        if not number:
            raise ValidationError("This receipt has not been generated yet.")
        response = HttpResponse(render_payment_pdf(invoice, kind), content_type="application/pdf")
        disposition = "attachment" if request.query_params.get("download") == "1" else "inline"
        response["Content-Disposition"] = f'{disposition}; filename="{number}.pdf"'
        response["Cache-Control"] = "private, no-store"
        return response


class CouponValidateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=CouponValidateSerializer, tags=["billing"])
    def post(self, request: Request) -> Response:
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(get_billing_service().validate_coupon(serializer.validated_data["code"]))


class RefundView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=RefundSerializer, tags=["billing"])
    def post(self, request: Request) -> Response:
        serializer = RefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        return Response(
            get_billing_service().refund(
                request.user.id,
                data["organization_id"],
                data["invoice_id"],
                data.get("amount_cents"),
            )
        )


class UsageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["billing"])
    def get(self, request: Request) -> Response:
        items = get_billing_service().usage(request.user.id, _require_org(request))
        return Response(UsageSerializer(items, many=True).data)


class DodoWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=["billing"])
    def post(self, request: Request) -> Response:
        raw_payload = request.body
        signature = request.headers.get("Webhook-Signature")
        payload = request.data if isinstance(request.data, dict) else {}
        result = get_billing_service().handle_dodo_webhook(
            payload,
            signature,
            raw_payload=raw_payload,
            webhook_id=request.headers.get("Webhook-Id"),
            webhook_timestamp=request.headers.get("Webhook-Timestamp"),
        )
        return Response(result)


class ManualPaymentInstructionsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["billing"])
    def get(self, request: Request) -> Response:
        return Response(get_billing_service().manual_payment_instructions())


class ManualPaymentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["billing"])
    def get(self, request: Request) -> Response:
        return Response(
            get_billing_service().list_manual_payments(request.user.id, _require_org(request))
        )

    @extend_schema(request=ManualPaymentCreateSerializer, tags=["billing"])
    def post(self, request: Request) -> Response:
        serializer = ManualPaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        result = get_billing_service().create_manual_payment(
            request.user.id,
            organization_id=data["organization_id"],
            plan_code=data["plan_code"],
            provider=data["provider"],
            payer_phone=data.get("payer_phone", ""),
            payer_name=data.get("payer_name", ""),
            transaction_id=data.get("transaction_id", ""),
            notes=data.get("notes", ""),
        )
        return Response(result, status=status.HTTP_201_CREATED)


class ManualPaymentSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ManualPaymentSubmitSerializer, tags=["billing"])
    def post(self, request: Request, request_id: UUID) -> Response:
        serializer = ManualPaymentSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        return Response(
            get_billing_service().submit_manual_payment(
                request.user.id,
                request_id,
                payer_phone=data["payer_phone"],
                payer_name=data.get("payer_name", ""),
                transaction_id=data["transaction_id"],
                notes=data.get("notes", ""),
            )
        )
