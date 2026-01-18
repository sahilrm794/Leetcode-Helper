from rest_framework import generics, permissions
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, ProblemSerializer
from .models import Problem

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class ProblemListCreateView(generics.ListCreateAPIView):
    serializer_class = ProblemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Problem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProblemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProblemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Problem.objects.filter(user=self.request.user)
