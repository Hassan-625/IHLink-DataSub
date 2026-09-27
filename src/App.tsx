import { Navigate, Route, Routes } from "react-router-dom";

import { ToastProvider } from "@/components/ui/Toast";
import { BrandIntro } from "@/components/BrandIntro";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DataSubPermissionGate } from "@/components/DataSubPermissionGate";
import { DataSubAccessDenied } from "@/pages/datasub/DataSubAccessDenied";

/* ============================================================
   DataSub Public Pages
============================================================ */

import { DataSubHome } from "@/pages/datasub/DataSubHome";
import { DataSubAirtime } from "@/pages/datasub/DataSubAirtime";
import { DataSubDataPlans } from "@/pages/datasub/DataSubDataPlans";
import { DataSubElectricity } from "@/pages/datasub/DataSubElectricity";
import { DataSubCable } from "@/pages/datasub/DataSubCable";
import { DataSubEducation } from "@/pages/datasub/DataSubEducation";
import { DataSubReseller } from "@/pages/datasub/DataSubReseller";
import { DataSubApi } from "@/pages/datasub/DataSubApi";
import { DataSubPricing } from "@/pages/datasub/DataSubPricing";
import { DataSubFaq } from "@/pages/datasub/DataSubFaq";
import { DataSubSupport } from "@/pages/datasub/DataSubSupport";
import { DataSubAirtimeToCash } from "@/pages/datasub/DataSubAirtimeToCash";
import { DataSubPrintCards } from "@/pages/datasub/DataSubPrintCards";

/* ============================================================
   DataSub Authenticated Pages
============================================================ */

import { DataSubDashboard } from "@/pages/datasub/DataSubDashboard";
import { DataSubWallet } from "@/pages/datasub/DataSubWallet";
import { DataSubTransactions } from "@/pages/datasub/DataSubTransactions";
import { PurchaseFlow } from "@/pages/datasub/PurchaseFlow";
import { DataSubResellerDashboard } from "@/pages/datasub/DataSubResellerDashboard";
import { DataSubApiDashboard } from "@/pages/datasub/DataSubApiDashboard";
import { DataSubUpgrade } from "@/pages/datasub/DataSubUpgrade";
import { DataSubServices } from "@/pages/datasub/DataSubServices";
import { DataSubCustomerTools } from "@/pages/datasub/DataSubCustomerTools";

/* ============================================================
   Authentication
============================================================ */

import { SignInPage } from "@/pages/auth/SignInPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { UpdatePasswordPage } from "@/pages/auth/UpdatePasswordPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { AuthHandoffPage } from "@/pages/auth/AuthHandoffPage";

/* ============================================================
   Customer Account
============================================================ */

import { AccountPage } from "@/pages/account/AccountPage";
import { NotificationsPage } from "@/pages/account/NotificationsPage";
import { ProfilePage } from "@/pages/account/ProfilePage";
import { BillingPage } from "@/pages/account/BillingPage";
import { AccountSupportPage } from "@/pages/account/AccountSupportPage";
import { AccountSecurityPage } from "@/pages/account/AccountSecurityPage";

/* ============================================================
   DataSub Administration
============================================================ */

import { AdminDataSubPage } from "@/pages/admin/AdminDataSubPage";
import { AdminDataSubProviderPricing } from "@/pages/admin/AdminDataSubProviderPricing";

/* ============================================================
   Other
============================================================ */

import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <ToastProvider>
      <BrandIntro>
        <Routes>

          {/* ==================================================
              DATASUB HOME
          ================================================== */}

          <Route
            path="/"
            element={<DataSubHome />}
          />

          <Route
            path="/datasub"
            element={<DataSubHome />}
          />

          {/* ==================================================
              PUBLIC DATASUB SERVICES
          ================================================== */}

          <Route
            path="/datasub/airtime"
            element={<DataSubAirtime />}
          />

          <Route
            path="/datasub/data-plans"
            element={<DataSubDataPlans />}
          />

          <Route
            path="/datasub/electricity"
            element={<DataSubElectricity />}
          />

          <Route
            path="/datasub/cable"
            element={<DataSubCable />}
          />

          <Route
            path="/datasub/education"
            element={<DataSubEducation />}
          />

          <Route
            path="/datasub/reseller"
            element={<DataSubReseller />}
          />

          <Route
            path="/datasub/api"
            element={<DataSubApi />}
          />

          <Route
            path="/datasub/pricing"
            element={<DataSubPricing />}
          />

          <Route
            path="/datasub/faq"
            element={<DataSubFaq />}
          />

          <Route
            path="/datasub/support"
            element={<DataSubSupport />}
          />

          <Route
            path="/datasub/airtime-to-cash"
            element={<DataSubAirtimeToCash />}
          />

          <Route
            path="/datasub/print-cards"
            element={<DataSubPrintCards />}
          />

          {/* ==================================================
              AUTHENTICATION
          ================================================== */}

          <Route
            path="/signin"
            element={<SignInPage />}
          />

          <Route
            path="/login"
            element={
              <Navigate
                to="/signin"
                replace
              />
            }
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />

          <Route
            path="/auth/update-password"
            element={<UpdatePasswordPage />}
          />

          <Route
            path="/verify-email"
            element={<VerifyEmailPage />}
          />

          <Route
            path="/auth/handoff"
            element={<AuthHandoffPage />}
          />

          {/* ==================================================
              OLD WELCOME TOUR

              The original IHLink welcome tour contained
              Corporate, SchoolPro, Consult, Hosting,
              Engineering and other platforms.

              This repository is DataSub only, so the old
              welcome-tour URL now opens DataSub.
          ================================================== */}

          <Route
            path="/welcome-tour"
            element={
              <Navigate
                to="/datasub/dashboard"
                replace
              />
            }
          />

          {/* ==================================================
              DATASUB PRIVATE SERVICES
          ================================================== */}

          <Route
            path="/datasub/services"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <DataSubServices />
              </ProtectedRoute>
            }
          />

          <Route
            path="/datasub/customer-tools"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <DataSubCustomerTools />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              DATASUB DASHBOARD
          ================================================== */}

          <Route
            path="/datasub/dashboard"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <DataSubDashboard />
              </ProtectedRoute>
            }
          />

          {/* Generic dashboard now belongs to DataSub */}

          <Route
            path="/dashboard"
            element={
              <Navigate
                to="/datasub/dashboard"
                replace
              />
            }
          />

          {/* ==================================================
              WALLET
          ================================================== */}

          <Route
            path="/datasub/wallet"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <DataSubWallet />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              TRANSACTIONS
          ================================================== */}

          <Route
            path="/datasub/transactions"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <DataSubTransactions />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              LEGACY PURCHASE REDIRECTS
          ================================================== */}

          <Route
            path="/datasub/buy-airtime"
            element={
              <Navigate
                to="/datasub/buy/airtime"
                replace
              />
            }
          />

          <Route
            path="/datasub/buy-data"
            element={
              <Navigate
                to="/datasub/buy/data"
                replace
              />
            }
          />

          <Route
            path="/datasub/pay-electricity"
            element={
              <Navigate
                to="/datasub/buy/electricity"
                replace
              />
            }
          />

          <Route
            path="/datasub/pay-cable"
            element={
              <Navigate
                to="/datasub/buy/cable"
                replace
              />
            }
          />

          <Route
            path="/datasub/buy-education"
            element={
              <Navigate
                to="/datasub/buy/education"
                replace
              />
            }
          />

          {/* ==================================================
              DATASUB PURCHASE FLOWS
          ================================================== */}

          <Route
            path="/datasub/buy/airtime"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <PurchaseFlow service="airtime" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/datasub/buy/data"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <PurchaseFlow service="data" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/datasub/buy/electricity"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <PurchaseFlow service="electricity" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/datasub/buy/cable"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <PurchaseFlow service="cable" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/datasub/buy/education"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <PurchaseFlow service="education" />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              RESELLER
          ================================================== */}

          <Route
            path="/datasub/reseller-dashboard"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <DataSubPermissionGate permission="reseller"><DataSubResellerDashboard /></DataSubPermissionGate>
              </ProtectedRoute>
            }
          />

          <Route
            path="/datasub/upgrade"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <DataSubUpgrade />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              DEVELOPER API
          ================================================== */}

          <Route
            path="/datasub/api-dashboard"
            element={
              <ProtectedRoute
                product="datasub"
                requireServiceAccess
              >
                <DataSubPermissionGate permission="api"><DataSubApiDashboard /></DataSubPermissionGate>
              </ProtectedRoute>
            }
          />

          <Route path="/datasub/profile" element={<ProtectedRoute product="datasub" requireServiceAccess><ProfilePage /></ProtectedRoute>} />
          <Route path="/datasub/notifications" element={<ProtectedRoute product="datasub" requireServiceAccess><NotificationsPage /></ProtectedRoute>} />
          <Route path="/datasub/support-centre" element={<ProtectedRoute product="datasub" requireServiceAccess><AccountSupportPage /></ProtectedRoute>} />
          <Route path="/datasub/contact" element={<DataSubSupport />} />
          <Route path="/datasub/security" element={<ProtectedRoute product="datasub" requireServiceAccess><AccountSecurityPage /></ProtectedRoute>} />
          <Route path="/datasub/access-denied" element={<DataSubAccessDenied />} />

          {/* ==================================================
              CUSTOMER ACCOUNT
          ================================================== */}

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/support"
            element={
              <ProtectedRoute>
                <AccountSupportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/security"
            element={
              <ProtectedRoute>
                <AccountSecurityPage />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              DATASUB ADMIN
          ================================================== */}

          <Route
            path="/admin/login"
            element={<SignInPage />}
          />

          <Route
            path="/admin"
            element={
              <Navigate
                to="/admin/datasub"
                replace
              />
            }
          />

          <Route
            path="/admin/datasub"
            element={
              <ProtectedRoute
                roles={[
                  "super_admin",
                  "platform_admin",
                  "support",
                  "finance",
                ]}
                product="datasub"
              >
                <AdminDataSubPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/datasub/provider-pricing"
            element={
              <ProtectedRoute
                roles={[
                  "super_admin",
                  "platform_admin",
                ]}
                product="datasub"
              >
                <AdminDataSubProviderPricing />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/access-denied" element={<Navigate to="/datasub/access-denied" replace />} />
          <Route path="/admin/notifications" element={<Navigate to="/datasub/notifications" replace />} />
          <Route path="/admin/settings" element={<Navigate to="/datasub/security" replace />} />

          {/* ==================================================
              404
          ================================================== */}

          <Route
            path="*"
            element={<NotFoundPage />}
          />

        </Routes>
      </BrandIntro>
    </ToastProvider>
  );
}