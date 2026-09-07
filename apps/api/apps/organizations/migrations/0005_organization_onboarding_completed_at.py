from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0004_organization_business_profile"),
    ]

    operations = [
        migrations.AddField(
            model_name="organization",
            name="onboarding_completed_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
    ]
