import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { closeLoginModal } from "../../store/modal/modalSlice";
import { checkEmailExists } from "../../api/util";
import { loginUser, registerUser } from "../../store/auth/authSlice";
import { RiCloseCircleFill } from "react-icons/ri";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const loginSchema = Yup.object({
  email: Yup.string().email().required(),
  password: Yup.string().required("Password is required"),
});

const registerSchema = Yup.object({
  email: Yup.string().email().required(),
  name: Yup.string().required("Name is required"),
  password: Yup.string().required("Password is required"),
});

const LoginModal = () => {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("init");
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  if (isAuthenticated) {
    dispatch(closeLoginModal());
  }

  const closeLoginModalHandler = () => {
    dispatch(closeLoginModal());
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
        const exists = await checkEmailExists(values.email);
        if (exists) {
          setMode("login");
        } else {
          setMode("register");
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
      console.error("Error:", error);
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

  return (
    <div className="size-full fixed top-0 left-0 bg-black/30 flex justify-center items-center z-100">
      <div className="bg-white h-1/2 p-4 rounded-lg aspect-square">
        <div className="flex-row-reverse w-100% flex">
          <button className="cursor-pointer" onClick={closeLoginModalHandler}>
            <RiCloseCircleFill size={25} />
          </button>
        </div>
        <div className="h-full flex flex-col justify-center-safe items-center gap-2">
          <p className="text-lg font-semibold text-center">
            {mode === "init" && " Please enter your email to continue."}
            {mode === "register" && " Register your account."}
            {mode === "login" && " Welcome back! Please login to your account."}
          </p>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Formik
            initialValues={{
              email: "",
              name: "",
              password: "",
            }}
            validationSchema={getValidationSchema()}
            onSubmit={handleFormSubmit}
            enableReinitialize={true}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="flex flex-col gap-2 justify-center-safety items-center">
                {(mode === "init" ||
                  mode === "login" ||
                  mode === "register") && (
                  <>
                    <Field
                      name="email"
                      className="bg-white border-2 px-2 py-1"
                      placeholder="E-mail"
                      disabled={mode !== "init"}
                    />
                    {touched.email && errors.email && (
                      <div className="text-xs text-red-600">{errors.email}</div>
                    )}
                  </>
                )}

                {mode === "register" && (
                  <>
                    <Field
                      name="name"
                      className="bg-white border-2 px-2 py-1"
                      placeholder="Full Name"
                    />
                    {touched.name && errors.name && (
                      <div className="text-xs text-red-600">{errors.name}</div>
                    )}
                  </>
                )}

                {(mode === "login" || mode === "register") && (
                  <>
                    <Field
                      name="password"
                      className="bg-white border-2 px-2 py-1"
                      placeholder="Password"
                      type="password"
                    />
                    {touched.password && errors.password && (
                      <div className="text-xs text-red-600">
                        {errors.password}
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  className="bg-amber-400 cursor-pointer px-6 py-4 w-fit rounded-2xl text-base"
                  disabled={isSubmitting || loading}
                >
                  {isSubmitting || loading ? "Loading..." : "Submit"}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
