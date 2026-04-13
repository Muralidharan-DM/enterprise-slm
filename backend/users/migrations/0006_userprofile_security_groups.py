from django.db import migrations, models


def _copy_fk_to_m2m(apps, schema_editor):
    """Copy the old single security_group FK → new security_groups M2M."""
    UserProfile = apps.get_model('users', 'UserProfile')
    for profile in UserProfile.objects.filter(security_group__isnull=False):
        profile.security_groups.add(profile.security_group)


class Migration(migrations.Migration):
    """
    Replace the old security_group ForeignKey on UserProfile with a
    security_groups ManyToManyField so that each user can belong to
    multiple security groups simultaneously.
    """

    dependencies = [
        ('users', '0005_user_role_superuser'),
        ('security', '0005_securitygroup_role_description'),
    ]

    operations = [
        # Step 1 – add the new M2M field
        migrations.AddField(
            model_name='userprofile',
            name='security_groups',
            field=models.ManyToManyField(
                blank=True,
                related_name='user_profiles',
                to='security.SecurityGroup',
            ),
        ),

        # Step 2 – copy existing FK → M2M rows
        migrations.RunPython(
            code=_copy_fk_to_m2m,
            reverse_code=migrations.RunPython.noop,
        ),

        # Step 3 – drop the old FK column
        migrations.RemoveField(
            model_name='userprofile',
            name='security_group',
        ),
    ]
