from django.db import models
from django.contrib.auth.models import User
from categories.models import Category

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='budgets')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date', '-id']

    def __str__(self):
        target = self.category.name if self.category else "Overall Monthly"
        return f"{target} Budget: ₹{self.amount} ({self.start_date} to {self.end_date})"
