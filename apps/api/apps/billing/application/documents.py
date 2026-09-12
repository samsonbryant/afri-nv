from __future__ import annotations

from typing import Literal

from apps.billing.infrastructure.models import Invoice


def _escape(value: object) -> str:
    return str(value or "").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def render_payment_pdf(invoice: Invoice, kind: Literal["invoice", "receipt"]) -> bytes:
    title = "PAYMENT INVOICE" if kind == "invoice" else "PAYMENT RECEIPT"
    document_number = invoice.number if kind == "invoice" else invoice.receipt_number
    lines = [
        "NOVIXA",
        title,
        "",
        f"Document number: {document_number}",
        f"Customer: {invoice.organization.name}",
        f"Amount: USD {invoice.amount_cents / 100:.2f}",
        f"Status: {invoice.status.upper()}",
        f"Payment method: {invoice.payment_provider.replace('_', ' ').title()}",
        f"Payment reference: {invoice.payment_reference}",
        f"Issued: {invoice.issued_at:%Y-%m-%d %H:%M UTC}" if invoice.issued_at else "",
        "",
        "Thank you for choosing Novixa.",
    ]
    commands = ["BT", "/F1 18 Tf", "72 760 Td", f"({_escape(lines[0])}) Tj", "/F1 12 Tf"]
    for line in lines[1:]:
        commands.extend(["0 -28 Td", f"({_escape(line)}) Tj"])
    commands.append("ET")
    stream = "\n".join(commands).encode("latin-1", errors="replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    )
    return bytes(pdf)
