"""Meetings API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.domain.exceptions import ValidationError
from apps.meetings.infrastructure.dependencies import get_meeting_service
from apps.meetings.interfaces.serializers.serializers import (
    BookingLinkSerializer,
    BookingLinkUpdateSerializer,
    BookingLinkWriteSerializer,
    BookingSerializer,
    CalendarCallbackSerializer,
    CalendarConnectionSerializer,
    CalendarConnectionWriteSerializer,
    CalendarConnectSerializer,
    MeetingSerializer,
    MeetingUpdateSerializer,
    MeetingWriteSerializer,
    PublicBookSerializer,
    ReminderSerializer,
    ReminderWriteSerializer,
)


def _require_org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class MeetingListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["meetings"])
    def get(self, request: Request) -> Response:
        items = get_meeting_service().list_meetings(request.user.id, _require_org(request))
        return Response(MeetingSerializer(items, many=True).data)

    @extend_schema(request=MeetingWriteSerializer, tags=["meetings"])
    def post(self, request: Request) -> Response:
        serializer = MeetingWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        org_id = data.pop("organization_id")
        item = get_meeting_service().create_meeting(request.user.id, org_id, data)
        return Response(MeetingSerializer(item).data, status=status.HTTP_201_CREATED)


class MeetingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["meetings"])
    def get(self, request: Request, meeting_id: UUID) -> Response:
        item = get_meeting_service().get_meeting(request.user.id, meeting_id)
        return Response(MeetingSerializer(item).data)

    @extend_schema(request=MeetingUpdateSerializer, tags=["meetings"])
    def patch(self, request: Request, meeting_id: UUID) -> Response:
        serializer = MeetingUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_meeting_service().update_meeting(
            request.user.id, meeting_id, serializer.validated_data
        )
        return Response(MeetingSerializer(item).data)

    @extend_schema(tags=["meetings"])
    def delete(self, request: Request, meeting_id: UUID) -> Response:
        get_meeting_service().delete_meeting(request.user.id, meeting_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeetingCreateLinkView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["meetings"])
    def post(self, request: Request, meeting_id: UUID) -> Response:
        item = get_meeting_service().create_meeting_link(request.user.id, meeting_id)
        return Response(MeetingSerializer(item).data)


class CalendarConnectionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["meetings"])
    def get(self, request: Request) -> Response:
        items = get_meeting_service().list_calendar_connections(
            request.user.id, _require_org(request)
        )
        return Response(CalendarConnectionSerializer(items, many=True).data)

    @extend_schema(request=CalendarConnectionWriteSerializer, tags=["meetings"])
    def post(self, request: Request) -> Response:
        serializer = CalendarConnectionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        org_id = data.pop("organization_id")
        item = get_meeting_service().create_calendar_connection(request.user.id, org_id, data)
        return Response(CalendarConnectionSerializer(item).data, status=status.HTTP_201_CREATED)


class CalendarConnectView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=CalendarConnectSerializer, tags=["meetings"])
    def post(self, request: Request, provider: str) -> Response:
        serializer = CalendarConnectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = get_meeting_service().connect_calendar(
            request.user.id, serializer.validated_data["organization_id"], provider
        )
        return Response(result)


class CalendarCallbackView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=CalendarCallbackSerializer, tags=["meetings"])
    def post(self, request: Request) -> Response:
        serializer = CalendarCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = get_meeting_service().calendar_callback(request.user.id, serializer.validated_data)
        return Response(CalendarConnectionSerializer(item).data, status=status.HTTP_201_CREATED)


class BookingLinkListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["meetings"])
    def get(self, request: Request) -> Response:
        items = get_meeting_service().list_booking_links(request.user.id, _require_org(request))
        return Response(BookingLinkSerializer(items, many=True).data)

    @extend_schema(request=BookingLinkWriteSerializer, tags=["meetings"])
    def post(self, request: Request) -> Response:
        serializer = BookingLinkWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        org_id = data.pop("organization_id")
        item = get_meeting_service().create_booking_link(request.user.id, org_id, data)
        return Response(BookingLinkSerializer(item).data, status=status.HTTP_201_CREATED)


class BookingLinkDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["meetings"])
    def get(self, request: Request, link_id: UUID) -> Response:
        item = get_meeting_service().get_booking_link(request.user.id, link_id)
        return Response(BookingLinkSerializer(item).data)

    @extend_schema(request=BookingLinkUpdateSerializer, tags=["meetings"])
    def patch(self, request: Request, link_id: UUID) -> Response:
        serializer = BookingLinkUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_meeting_service().update_booking_link(
            request.user.id, link_id, serializer.validated_data
        )
        return Response(BookingLinkSerializer(item).data)

    @extend_schema(tags=["meetings"])
    def delete(self, request: Request, link_id: UUID) -> Response:
        get_meeting_service().delete_booking_link(request.user.id, link_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicBookingView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(tags=["meetings"])
    def get(self, request: Request, slug: str) -> Response:
        item = get_meeting_service().get_public_booking_link(slug)
        return Response(BookingLinkSerializer(item).data)

    @extend_schema(request=PublicBookSerializer, tags=["meetings"])
    def post(self, request: Request, slug: str) -> Response:
        serializer = PublicBookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = get_meeting_service().book_public(slug, serializer.validated_data)
        return Response(BookingSerializer(item).data, status=status.HTTP_201_CREATED)


class ReminderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["meetings"])
    def get(self, request: Request, meeting_id: UUID) -> Response:
        items = get_meeting_service().list_reminders(request.user.id, meeting_id)
        return Response(ReminderSerializer(items, many=True).data)

    @extend_schema(request=ReminderWriteSerializer, tags=["meetings"])
    def post(self, request: Request, meeting_id: UUID) -> Response:
        serializer = ReminderWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = get_meeting_service().create_reminder(
            request.user.id, meeting_id, serializer.validated_data
        )
        return Response(ReminderSerializer(item).data, status=status.HTTP_201_CREATED)
