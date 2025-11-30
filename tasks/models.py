from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import json


class Task(models.Model):
    """
    Task model for storing task information
    """
    title = models.CharField(max_length=255)
    due_date = models.DateField()
    estimated_hours = models.FloatField(validators=[MinValueValidator(0.5)])
    importance = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        default=5
    )
    dependencies = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def to_dict(self):
        """Convert task to dictionary for API responses"""
        return {
            'id': self.id,
            'title': self.title,
            'due_date': self.due_date.strftime('%Y-%m-%d'),
            'estimated_hours': self.estimated_hours,
            'importance': self.importance,
            'dependencies': self.dependencies
        }
