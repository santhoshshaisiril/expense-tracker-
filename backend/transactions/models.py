from django.db import models
from django.contrib.auth.models import User
from categories.models import Category

class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('Income', 'Income'),
        ('Expense', 'Expense'),
    )

    PAYMENT_METHOD_CHOICES = (
        ('Cash', 'Cash'),
        ('UPI', 'UPI'),
        ('Debit Card', 'Debit Card'),
        ('Credit Card', 'Credit Card'),
        ('Bank Transfer', 'Bank Transfer'),
        ('Other', 'Other'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='transactions')
    description = models.CharField(max_length=255)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES)
    transaction_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-transaction_date', '-id']

    def __str__(self):
        return f"{self.transaction_type}: ₹{self.amount} - {self.description} ({self.transaction_date})"
