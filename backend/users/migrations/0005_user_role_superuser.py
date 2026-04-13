from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_userprofile_contact'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[('admin', 'Admin'), ('user', 'User'), ('super_user', 'Super User')],
                default='user',
                max_length=20,
            ),
        ),
    ]
