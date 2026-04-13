from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('security', '0003_securitygroup'),
    ]

    operations = [
        migrations.AlterField(
            model_name='securityscope',
            name='domain',
            field=models.TextField(blank=True, default='[]'),
        ),
        migrations.AlterField(
            model_name='securityscope',
            name='subdomain',
            field=models.TextField(blank=True, default='[]'),
        ),
    ]
