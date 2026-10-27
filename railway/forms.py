from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.forms import formset_factory

from .models import Member, Passenger


INPUT = {"class": "input"}
SELECT = {"class": "select"}
DATE = {"class": "input", "type": "date"}


class LoginForm(AuthenticationForm):
    username = forms.CharField(
        label="帳號",
        widget=forms.TextInput(attrs={**INPUT, "autocomplete": "username", "placeholder": "請輸入帳號"}),
    )
    password = forms.CharField(
        label="密碼",
        widget=forms.PasswordInput(attrs={**INPUT, "autocomplete": "current-password", "placeholder": "請輸入密碼"}),
    )


class SignupForm(UserCreationForm):
    email = forms.EmailField(label="電子郵件", required=True, widget=forms.EmailInput(attrs={**INPUT, "autocomplete": "email"}))
    phone = forms.CharField(
        label="手機號碼",
        required=False,
        max_length=20,
        widget=forms.TextInput(attrs={**INPUT, "placeholder": "0912-345-678", "autocomplete": "tel"}),
    )
    first_name = forms.CharField(label="名字", required=False, max_length=30, widget=forms.TextInput(attrs=INPUT))

    class Meta:
        model = Member
        fields = ("username", "email", "phone", "first_name")
        widgets = {"username": forms.TextInput(attrs={**INPUT, "autocomplete": "username"})}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["password1"].widget.attrs.update({**INPUT, "autocomplete": "new-password"})
        self.fields["password2"].widget.attrs.update({**INPUT, "autocomplete": "new-password"})

    def clean_email(self):
        email = self.cleaned_data["email"].lower()
        if Member.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("這個電子郵件已經註冊過了。")
        return email


class ProfileForm(forms.ModelForm):
    class Meta:
        model = Member
        fields = ("first_name", "last_name", "email", "phone", "birth_date", "id_number", "preferred_font_scale")
        widgets = {
            "first_name": forms.TextInput(attrs=INPUT),
            "last_name": forms.TextInput(attrs=INPUT),
            "email": forms.EmailInput(attrs=INPUT),
            "phone": forms.TextInput(attrs={**INPUT, "placeholder": "0912-345-678"}),
            "birth_date": forms.DateInput(attrs=DATE),
            "id_number": forms.TextInput(attrs={**INPUT, "placeholder": "A123456789"}),
            "preferred_font_scale": forms.Select(attrs=SELECT),
        }


class PassengerForm(forms.ModelForm):
    class Meta:
        model = Passenger
        fields = ("name", "id_number", "birth_date", "phone", "email")
        widgets = {
            "name": forms.TextInput(attrs={**INPUT, "placeholder": "與身分證相同的中文姓名", "autocomplete": "name"}),
            "id_number": forms.TextInput(attrs={**INPUT, "placeholder": "A123456789"}),
            "birth_date": forms.DateInput(attrs=DATE),
            "phone": forms.TextInput(attrs={**INPUT, "placeholder": "0912-345-678", "autocomplete": "tel"}),
            "email": forms.EmailInput(attrs={**INPUT, "placeholder": "選填", "autocomplete": "email"}),
        }


PassengerFormSet = formset_factory(PassengerForm, extra=0, max_num=4, validate_max=True)
