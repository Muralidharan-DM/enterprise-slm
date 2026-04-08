from django.db import models
from users.models import User

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.email}"

import json

class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('bot', 'Bot')
    ]
    
    session = models.ForeignKey(ChatSession, related_name='messages', on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    text = models.TextField(blank=True, null=True)
    
    # Store the analytics payload (summary, chart, table) if it's a bot message via TextField
    _data_payload = models.TextField(blank=True, null=True, default="{}")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def data_payload(self):
        try:
            return json.loads(self._data_payload)
        except:
            return {}
            
    @data_payload.setter
    def data_payload(self, value):
        self._data_payload = json.dumps(value)

    class Meta:
        ordering = ['created_at']

