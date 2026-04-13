from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('security', '0002_rowsecuritygroup'),
    ]

    operations = [
        migrations.CreateModel(
            name='SecurityGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='RowLevelSecurity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('table_name', models.CharField(max_length=100)),
                ('column_name', models.CharField(max_length=100)),
                ('condition', models.CharField(max_length=255)),
                ('security_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rls', to='security.securitygroup')),
            ],
        ),
        migrations.CreateModel(
            name='ColumnLevelSecurity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('table_name', models.CharField(max_length=100)),
                ('column_name', models.CharField(max_length=100)),
                ('is_masked', models.BooleanField(default=False)),
                ('security_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cls', to='security.securitygroup')),
            ],
        ),
        migrations.CreateModel(
            name='SecurityScope',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('region', models.CharField(blank=True, max_length=100)),
                ('domain', models.CharField(blank=True, max_length=100)),
                ('subdomain', models.CharField(blank=True, max_length=100)),
                ('business_unit', models.CharField(blank=True, max_length=100)),
                ('security_group', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='scope', to='security.securitygroup')),
            ],
        ),
    ]
