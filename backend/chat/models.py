from django.db import models
from users.models import User
import json

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.email}"

class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('bot', 'Bot')
    ]
    
    session = models.ForeignKey(ChatSession, related_name='messages', on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    _content = models.TextField(default="{}")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def content(self):
        try:
            return json.loads(self._content)
        except:
            return {}

    @content.setter
    def content(self, value):
        self._content = json.dumps(value)

    class Meta:
        ordering = ['created_at']
