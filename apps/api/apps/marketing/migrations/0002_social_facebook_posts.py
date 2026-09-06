# Generated manually for social / Facebook ads / multi-post.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("organizations", "0001_initial"),
        ("marketing", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SocialConnection",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("platform", models.CharField(db_index=True, max_length=32)),
                ("account_name", models.CharField(blank=True, default="", max_length=255)),
                ("account_id", models.CharField(blank=True, default="", max_length=128)),
                ("access_token", models.TextField(blank=True, default="")),
                ("refresh_token", models.TextField(blank=True, default="")),
                ("status", models.CharField(db_index=True, default="connected", max_length=32)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                (
                    "connected_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="social_connections",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="social_connections",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "marketing_social_connection",
                "ordering": ("-created_at",),
                "unique_together": {("organization", "platform", "account_id")},
            },
        ),
        migrations.CreateModel(
            name="FacebookAdCampaign",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255)),
                ("caption_prompt", models.TextField(blank=True, default="")),
                ("caption", models.TextField(blank=True, default="")),
                ("status", models.CharField(db_index=True, default="draft", max_length=32)),
                ("scheduled_at", models.DateTimeField(blank=True, null=True)),
                ("automation_enabled", models.BooleanField(default=False)),
                ("target_audience", models.JSONField(blank=True, default=dict)),
                ("budget_cents", models.PositiveIntegerField(default=0)),
                ("currency", models.CharField(default="usd", max_length=8)),
                ("metrics", models.JSONField(blank=True, default=dict)),
                (
                    "connection",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="facebook_ads",
                        to="marketing.socialconnection",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="facebook_ad_campaigns",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="facebook_ad_campaigns",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "marketing_facebook_ad_campaign",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="SocialPost",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("content", models.TextField()),
                ("media_urls", models.JSONField(blank=True, default=list)),
                ("platforms", models.JSONField(blank=True, default=list)),
                ("status", models.CharField(db_index=True, default="draft", max_length=32)),
                ("scheduled_at", models.DateTimeField(blank=True, null=True)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("results", models.JSONField(blank=True, default=dict)),
                ("include_whatsapp", models.BooleanField(default=False)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="social_posts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="social_posts",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "marketing_social_post",
                "ordering": ("-created_at",),
            },
        ),
    ]
