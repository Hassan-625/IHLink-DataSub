import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { AuthShell } from "./AuthShell";
import { Input, Select, Checkbox } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export function RegisterPage() {
  const { signUp, configured } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    sex: "",
    email: "",
    service: "datasub",
    password: "",
    confirm: "",
  });

  const [accepted, setAccepted] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (key: string, value: string) =>
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      return setError(
        "Use at least eight characters for your password.",
      );
    }

    if (form.password !== form.confirm) {
      return setError("The two passwords do not match.");
    }

    if (!accepted) {
      return setError(
        "Please accept the Terms and Privacy Policy.",
      );
    }

    setBusy(true);

    const result = await signUp({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      middleName: form.middleName,
      lastName: form.lastName,
      phone: form.phone,
      sex: form.sex,
      newsletterOptIn,
      service: "datasub",
    });

    setBusy(false);

    if (result.error) {
      return setError(result.error);
    }

    if (result.existingAccount) {
      navigate("/signin", {
        state: {
          authNotice:
            "An IHLink account already exists for this email. Sign in with its password or use Forgot password to recover access.",
        },
      });
      return;
    }

    if (result.needsVerification) {
      navigate("/verify-email", {
        state: { email: form.email },
      });
    } else {
      navigate("/account");
    }
  }

  return (
    <AuthShell
      title="Create your DataSub account"
      subtitle="Join IHLink DataSub as a Smart Earner and access digital services from one account."
    >
      {!configured && (
        <div className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0" />

          <span>
            Registration is temporarily unavailable because
            the account service is not configured in this
            deployment.
          </span>
        </div>
      )}

      <form
        onSubmit={submit}
        className="grid grid-cols-2 gap-4"
      >
        <Input
          required
          value={form.firstName}
          onChange={(e) =>
            update("firstName", e.target.value)
          }
          label="First name"
        />

        <Input
          value={form.middleName}
          onChange={(e) =>
            update("middleName", e.target.value)
          }
          label="Middle name"
        />

        <Input
          required
          value={form.lastName}
          onChange={(e) =>
            update("lastName", e.target.value)
          }
          label="Surname / last name"
        />

        <Input
          required
          value={form.phone}
          onChange={(e) =>
            update("phone", e.target.value)
          }
          label="Phone number"
          type="tel"
        />

        <Select
          required
          value={form.sex}
          onChange={(e) =>
            update("sex", e.target.value)
          }
          label="Sex"
          options={[
            { value: "", label: "Select" },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            {
              value: "prefer_not_to_say",
              label: "Prefer not to say",
            },
          ]}
        />

        <div className="col-span-2">
          <Input
            required
            value={form.email}
            onChange={(e) =>
              update("email", e.target.value)
            }
            label="Email address"
            type="email"
          />
        </div>

        <Input
          required
          value={form.password}
          onChange={(e) =>
            update("password", e.target.value)
          }
          label="Password"
          type="password"
        />

        <Input
          required
          value={form.confirm}
          onChange={(e) =>
            update("confirm", e.target.value)
          }
          label="Confirm password"
          type="password"
        />

        <div className="col-span-2">
          <Checkbox
            checked={accepted}
            onChange={(e) =>
              setAccepted(e.target.checked)
            }
            label="I accept the Terms and Privacy Policy"
          />

          <div className="mt-3">
            <Checkbox
              checked={newsletterOptIn}
              onChange={(e) =>
                setNewsletterOptIn(e.target.checked)
              }
              label="Send me DataSub updates, promotions and newsletters"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600"
            >
              {error}
            </p>
          )}

          <Button
            disabled={busy}
            fullWidth
            size="lg"
            className="mt-5"
            leftIcon={
              <CheckCircle2 className="h-4 w-4" />
            }
          >
            {busy
              ? "Creating account..."
              : "Create Account"}
          </Button>

          <p className="mt-4 text-center text-sm text-muted">
            Already registered?{" "}
            <Link
              to="/signin"
              className="font-bold text-royal-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}