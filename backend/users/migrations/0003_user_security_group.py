from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('security', '0003_securitygroup'),
        ('users', '0002_auto_20260408_2331'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='security_group',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='security.securitygroup',
            ),
        ),
    ]
