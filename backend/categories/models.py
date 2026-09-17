from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    CATEGORY_TYPE_CHOICES = (
        ('Income', 'Income'),
        ('Expense', 'Expense'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=10, choices=CATEGORY_TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        unique_together = ('user', 'name', 'category_type')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.category_type})"
