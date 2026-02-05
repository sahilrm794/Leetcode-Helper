from django.urls import path
from .views import (
    RegisterView,
    ProblemListCreateView,
    ProblemDetailView,
    get_hint,
    update_problem_hint,
    get_user_stats,
)

urlpatterns = [
    # Auth (kept for backwards compatibility, but Firebase is primary)
    path('auth/register/', RegisterView.as_view()),

    # Hint endpoint (main API for extension)
    path('hint/', get_hint, name='get_hint'),

    # Problems CRUD
    path('problems/', ProblemListCreateView.as_view(), name='problem_list'),
    path('problems/<int:pk>/', ProblemDetailView.as_view(), name='problem_detail'),
    path('problems/<int:pk>/hint/', update_problem_hint, name='update_problem_hint'),

    # User stats
    path('stats/', get_user_stats, name='user_stats'),
]
