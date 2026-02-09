import requests
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.conf import settings
from .serializers import RegisterSerializer, ProblemSerializer
from .models import Problem
import os
from dotenv import load_dotenv
load_dotenv()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class ProblemListCreateView(generics.ListCreateAPIView):
    serializer_class = ProblemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Problem.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProblemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProblemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Problem.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def get_hint(request):
    """
    Get AI hint from Groq for a LeetCode problem.

    Request body:
    {
        "title": "Two Sum",
        "description": "Given an array...",
        "user_code": "function twoSum...",
        "conversation_history": [...]  # Optional: for context
    }
    """
    title = request.data.get('title', '')
    description = request.data.get('description', '')
    user_code = request.data.get('user_code', '')
    conversation_history = request.data.get('conversation_history', [])
    follow_up_question = request.data.get('follow_up_question', '')

    if not description or not user_code:
        return Response(
            {'error': 'Description and user_code are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Build the prompt
    prompt = build_mentor_prompt(title, description, user_code, conversation_history, follow_up_question)

    # Call Groq API
    try:
        hint = call_groq_api(prompt)

        # If user is authenticated, save the problem/hint
        problem_id = None
        if request.user.is_authenticated and not follow_up_question:
            problem = Problem.objects.create(
                user=request.user,
                title=title,
                description=description,
                user_code=user_code,
                ai_hint=hint,
                status='Pending',
                tags=[]
            )
            problem_id = problem.id

        return Response({
            'hint': hint,
            'problem_id': problem_id
        })

    except Exception as e:
        return Response(
            {'error': f'Failed to get hint: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_problem_hint(request, pk):
    """Update an existing problem with a new follow-up hint."""
    try:
        problem = Problem.objects.get(pk=pk, user=request.user)
        new_hint = request.data.get('hint', '')

        if new_hint:
            # Append to existing hint
            problem.ai_hint = f"{problem.ai_hint}\n\n---\n\n{new_hint}"
            problem.save()

        return Response({'success': True})
    except Problem.DoesNotExist:
        return Response(
            {'error': 'Problem not found'},
            status=status.HTTP_404_NOT_FOUND
        )


def build_mentor_prompt(title, description, user_code, conversation_history=None, follow_up_question=''):
    """Build the prompt for Groq API."""

    base_prompt = f"""You are an expert competitive programmer and mentor helping students improve their coding skills. A user has written a partial or complete solution to a LeetCode-style problem. Your job is to act like a mentor and give helpful, concise feedback **without giving away the full correct solution unless it is already present**.

Here is what you need to do:

1. **Understand the user's intent** from the provided code and explain briefly what their current solution seems to be doing.
2. **Check the logic** and **suggest whether the user is moving in the right direction** to solve the problem or not.
3. Look for common mistakes such as:
   - Incorrect or inconsistent **variable names** (e.g., `arr` vs `nums`, `n` misused etc.)
   - Off-by-one errors or **out-of-bound access** in **loop conditions**.
   - Accidental use of `--` instead of `++`, or vice versa.
   - Any obvious **syntax errors**.
4. If the code is complete, point out if there are **ways to optimize the time or space complexity**.
5. If the solution has a bug or won't work in some cases, **explain clearly why it will fail** and give an **example edge case** that would break it (without solving it).
6. Be supportive and constructive — give **clear hints** or ask **leading questions** that guide the user to the right solution path.
7. Do **not provide the full solution** unless it is already fully implemented and just needs review.

Here is the Leetcode Problem:
**{title}**

{description}

Here is the user's code:
```
{user_code}
```
"""

    # Add conversation history for context
    if conversation_history and len(conversation_history) > 0:
        base_prompt += "\n\n**Previous conversation:**\n"
        for msg in conversation_history[-5:]:  # Keep last 5 exchanges for context
            role = "User" if msg.get('role') == 'user' else "Mentor"
            base_prompt += f"\n{role}: {msg.get('content', '')}\n"

    # Add follow-up question if present
    if follow_up_question:
        base_prompt += f"\n\n**User's follow-up question:** {follow_up_question}\n"
        base_prompt += "\nPlease answer the follow-up question based on the context above. Keep your response concise and helpful."
    else:
        base_prompt += """

Give a very concise Hint of 10-15 Lines.
The response should be direct and mentor-like, not AI-like. Refer to the user as "you".
Give the response in clear points.
Do not start with phrases like "Okay, I will give you a concise hint" - just give the hint directly."""

    return base_prompt


def call_groq_api(prompt):
    """Call Groq API and return the response."""
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise Exception("Groq API key not configured")

    url = "https://api.groq.com/openai/v1/chat/completions"

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are an expert competitive programmer and coding mentor."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.4,
        "max_tokens": 1024
    }

    response = requests.post(
        url,
        json=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    )

    if not response.ok:
        error_data = response.json()
        raise Exception(error_data.get('error', {}).get('message', 'Request failed'))

    data = response.json()
    return data.get('choices', [{}])[0].get('message', {}).get('content', 'No hint generated.')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_stats(request):
    """Get user statistics for dashboard."""
    user = request.user
    problems = Problem.objects.filter(user=user)

    return Response({
        'total_problems': problems.count(),
        'solved': problems.filter(status='Solved').count(),
        'need_revision': problems.filter(status='Need Revision').count(),
        'pending': problems.filter(status='Pending').count(),
    })
