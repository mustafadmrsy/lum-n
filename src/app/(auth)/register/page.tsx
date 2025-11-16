"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, error } = useAuthStore();

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!formData.displayName.trim()) {
      errors.displayName = "İsim gereklidir";
    } else if (formData.displayName.trim().length < 2) {
      errors.displayName = "İsim en az 2 karakter olmalıdır";
    }

    if (!formData.email.trim()) {
      errors.email = "E-posta gereklidir";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Geçerli bir e-posta adresi girin";
    }

    if (!formData.password) {
      errors.password = "Şifre gereklidir";
    } else if (formData.password.length < 8) {
      errors.password = "Şifre en az 8 karakter olmalıdır";
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = "Şifre en az bir büyük harf içermelidir";
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = "Şifre en az bir küçük harf içermelidir";
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = "Şifre en az bir rakam içermelidir";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Şifre onayı gereklidir";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Şifreler eşleşmiyor";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await registerUser(
      formData.email,
      formData.password,
      formData.displayName
    );

    if (success) {
      router.push("/");
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hesap Oluştur
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Giriş yapın
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="displayName" className="sr-only">
                İsim Soyisim
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  validationErrors.displayName
                    ? "border-red-300"
                    : "border-gray-300"
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="İsim Soyisim"
                value={formData.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
              />
              {validationErrors.displayName && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors.displayName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email-address" className="sr-only">
                E-posta
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  validationErrors.email ? "border-red-300" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="E-posta"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  validationErrors.password
                    ? "border-red-300"
                    : "border-gray-300"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Şifre"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Şifre Onayı
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  validationErrors.confirmPassword
                    ? "border-red-300"
                    : "border-gray-300"
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Şifre Onayı"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">Şifre gereksinimleri:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>En az 8 karakter</li>
              <li>En az bir büyük harf</li>
              <li>En az bir küçük harf</li>
              <li>En az bir rakam</li>
            </ul>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
