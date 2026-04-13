from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user_security_group'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='contact',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
    ]
