from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('security', '0004_alter_securityscope_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='securitygroup',
            name='description',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='securitygroup',
            name='role',
            field=models.CharField(
                blank=True, default='', max_length=20,
                choices=[('super_user', 'Super User'), ('admin', 'Admin'), ('user', 'User')],
            ),
        ),
    ]
