import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { closeLoginModal } from "../../store/modal/modalSlice";
import { checkEmailExists } from "../../api/util";
import { clearError, loginUser, registerUser } from "../../store/auth/authSlice";
import { Eye, EyeOff, X } from "lucide-react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const loginSchema = Yup.object({
  email: Yup.string().email().required(),
  password: Yup.string().required("Password is required"),
});

const registerSchema = Yup.object({
  email: Yup.string().email().required(),
  name: Yup.string().required("Name is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

const getPasswordStrength = (password = "") => {
  if (!password) {
    return { label: "", toneClass: "", progressClass: "w-0" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      label: "Weak password",
      toneClass: "text-red-600",
      progressClass: "w-1/4 bg-red-500",
    };
  }

  if (score === 2 || score === 3) {
    return {
      label: "Good password",
      toneClass: "text-amber-700",
      progressClass: "w-2/3 bg-amber-500",
    };
  }

  return {
    label: "Strong password",
    toneClass: "text-emerald-700",
    progressClass: "w-full bg-emerald-600",
  };
};

const LoginModal = () => {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("init");
  const [resolvedEmail, setResolvedEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(closeLoginModal());
  }, [isAuthenticated, dispatch]);

  const closeLoginModalHandler = () => {
    dispatch(clearError());
    dispatch(closeLoginModal());
  };

  const goToMode = (nextMode) => {
    dispatch(clearError());
    setShowPassword(false);
    setMode(nextMode);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleFormSubmit = async (values, actions) => {
    try {
      if (mode === "init") {
        dispatch(clearError());
        const exists = await checkEmailExists(values.email);
        setResolvedEmail(values.email);
        if (exists) {
          goToMode("login");
        } else {
          goToMode("register");
        }
        actions.setSubmitting(false);
      } else if (mode === "login") {
        const result = await dispatch(
          loginUser({
            email: values.email,
            password: values.password,
          })
        );

        if (loginUser.fulfilled.match(result)) {
          closeLoginModalHandler();
        }
        actions.setSubmitting(false);
      } else if (mode === "register") {
        const result = await dispatch(
          registerUser({
            email: values.email,
            name: values.name,
            password: values.password,
          })
        );

        if (registerUser.fulfilled.match(result)) {
          closeLoginModalHandler();
        }
        actions.setSubmitting(false);
      }
    } catch (error) {
      actions.setSubmitting(false);
    }
  };

  const getValidationSchema = () => {
    if (mode === "register") return registerSchema;
    if (mode === "login") return loginSchema;
    return Yup.object({ email: Yup.string().email().required() });
  };

  if (isAuthenticated) {
    return null;
  }

  const headingText =
    mode === "init"
      ? "Welcome to Shilpika"
      : mode === "register"
        ? "Create your Shilpika account"
        : "Welcome back";

  const subHeadingText =
    mode === "init"
      ? "Enter your email to continue with a personalized shopping experience."
      : mode === "register"
        ? "Complete your details to start collecting handcrafted treasures."
        : "Sign in to continue from where you left off.";

  const submitLabel =
    mode === "init"
      ? "Continue"
      : mode === "register"
        ? "Create Account"
        : "Sign In";

  const initialValues = {
    email: resolvedEmail,
    name: "",
    password: "",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900"
          onClick={closeLoginModalHandler}
          aria-label="Close login modal"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-5">
          <aside className="relative hidden md:col-span-2 md:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#fcd34d_0%,transparent_55%),radial-gradient(circle_at_80%_75%,#f97316_0%,transparent_58%),linear-gradient(160deg,#78350f_0%,#9a3412_45%,#7c2d12_100%)]" />
            <div className="relative flex h-full min-h-[560px] flex-col justify-between p-8 text-amber-50">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-amber-100/90">Shilpika</p>
                <h2 className="mt-3 text-3xl leading-tight">Handcrafted stories, now one sign in away.</h2>
                <p className="mt-4 text-sm text-amber-100/85">
                  Save favorites, speed up checkout, and keep track of your artisan picks in one place.
                </p>
              </div>
              <div className="space-y-3 text-sm text-amber-100/90">
                <p>Personalized recommendations</p>
                <p>Quick reorders from past purchases</p>
                <p>Faster checkout with saved details</p>
              </div>
            </div>
          </aside>

          <div className="md:col-span-3 p-6 sm:p-8 md:p-10">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Secure Account Access</p>
              <h3 className="mt-2 text-2xl font-semibold text-gray-900">{headingText}</h3>
              <p className="mt-2 text-sm text-gray-600">{subHeadingText}</p>
            </div>

            {(mode === "login" || mode === "register") && resolvedEmail ? (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-900">
                  Continuing with <span className="font-semibold">{resolvedEmail}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResolvedEmail("");
                    goToMode("init");
                  }}
                  className="mt-1 text-xs font-semibold text-amber-800 hover:text-amber-900"
                >
                  Change email
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Formik
              initialValues={initialValues}
              validationSchema={getValidationSchema()}
              onSubmit={handleFormSubmit}
              enableReinitialize
            >
              {({ errors, touched, values, isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="you@example.com"
                      disabled={mode !== "init"}
                    />
                    {touched.email && errors.email ? (
                      <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
                    ) : null}
                  </div>

                  {mode === "register" ? (
                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                      <Field
                        id="name"
                        name="name"
                        className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        placeholder="Enter your full name"
                      />
                      {touched.name && errors.name ? (
                        <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {mode === "login" || mode === "register" ? (
                    <div>
                      <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                      <div className="relative">
                        <Field
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                          placeholder={mode === "register" ? "Create a password" : "Enter your password"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {touched.password && errors.password ? (
                        <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
                      ) : null}

                      {mode === "register" && values.password ? (
                        <>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full transition-all ${getPasswordStrength(values.password).progressClass}`}
                            />
                          </div>
                          <p className={`mt-1.5 text-xs ${getPasswordStrength(values.password).toneClass}`}>
                            {getPasswordStrength(values.password).label}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            Use 8+ characters with upper/lowercase letters, a number, and a symbol.
                          </p>
                        </>
                      ) : null}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-orange-700 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting || loading ? "Please wait..." : submitLabel}
                  </button>
                </Form>
              )}
            </Formik>

            {mode === "login" ? (
              <p className="mt-5 text-center text-sm text-gray-600">
                New to Shilpika?{' '}
                <button
                  type="button"
                  className="font-semibold text-amber-800 hover:text-amber-900"
                  onClick={() => goToMode("register")}
                >
                  Create an account
                </button>
              </p>
            ) : null}

            {mode === "register" ? (
              <p className="mt-5 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-semibold text-amber-800 hover:text-amber-900"
                  onClick={() => goToMode("login")}
                >
                  Sign in
                </button>
              </p>
            ) : null}

            {mode === "init" ? (
              <p className="mt-5 text-center text-xs text-gray-500">
                We only use your email to identify your account and keep checkout seamless.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
