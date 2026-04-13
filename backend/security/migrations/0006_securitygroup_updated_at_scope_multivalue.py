from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('security', '0005_securitygroup_role_description'),
    ]

    operations = [
        # Add updated_at to SecurityGroup
        migrations.AddField(
            model_name='securitygroup',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        # Change region from CharField to TextField (stores JSON array)
        migrations.AlterField(
            model_name='securityscope',
            name='region',
            field=models.TextField(blank=True, default='[]'),
        ),
        # Change business_unit from CharField to TextField (stores JSON array)
        migrations.AlterField(
            model_name='securityscope',
            name='business_unit',
            field=models.TextField(blank=True, default='[]'),
        ),
    ]
