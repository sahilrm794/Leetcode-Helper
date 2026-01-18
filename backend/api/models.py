from django.db import models
from django.contrib.auth.models import User

class Problem(models.Model):
    STATUS_CHOICES = [
        ('Solved', 'Solved'),
        ('Need Revision', 'Need Revision'),
        ('Pending', 'Pending'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='problems')
    title = models.CharField(max_length=255)
    description = models.TextField()
    user_code = models.TextField()
    ai_hint = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    tags = models.JSONField(default=list)

    def __str__(self):
        return self.title
