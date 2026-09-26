import { lazy, Suspense } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { BrandIntro } from "@/components/BrandIntro";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { deployedPlatform } from "@/lib/platformUrls";



import { CorporateHome } from "@/pages/corporate/CorporateHome";
import { AboutPage } from "@/pages/corporate/AboutPage";
import { ServicesPage } from "@/pages/corporate/ServicesPage";
import { OnboardingPage } from "@/pages/corporate/OnboardingPage";
import { ContactPage } from "@/pages/corporate/ContactPage";
import { PortfolioPage } from "@/pages/corporate/PortfolioPage";
import { CaseStudiesPage } from "@/pages/corporate/CaseStudiesPage";
import { TestimonialsPage } from "@/pages/corporate/TestimonialsPage";
import { BlogPage } from "@/pages/corporate/BlogPage";
import { BlogArticlePage } from "@/pages/corporate/BlogArticlePage";
import { CareersPage } from "@/pages/corporate/CareersPage";
import { PartnersPage } from "@/pages/corporate/PartnersPage";
import { FAQPage } from "@/pages/corporate/FAQPage";
import { PrivacyPage } from "@/pages/corporate/PrivacyPage";
import { TermsPage } from "@/pages/corporate/TermsPage";
import { SupportPage } from "@/pages/corporate/SupportPage";

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
import { DataSubDashboard } from "@/pages/datasub/DataSubDashboard";
import { DataSubWallet } from "@/pages/datasub/DataSubWallet";
import { DataSubTransactions } from "@/pages/datasub/DataSubTransactions";
import { PurchaseFlow } from "@/pages/datasub/PurchaseFlow";
import { DataSubResellerDashboard } from "@/pages/datasub/DataSubResellerDashboard";
import { DataSubApiDashboard } from "@/pages/datasub/DataSubApiDashboard";
import { DataSubUpgrade } from "@/pages/datasub/DataSubUpgrade";
import { DataSubAirtimeToCash } from "@/pages/datasub/DataSubAirtimeToCash";
import { DataSubPrintCards } from "@/pages/datasub/DataSubPrintCards";
import { DataSubServices } from "@/pages/datasub/DataSubServices";
import { DataSubCustomerTools } from "@/pages/datasub/DataSubCustomerTools";

import { SchoolProHome } from "@/pages/schoolpro/SchoolProHome";
import { SchoolProFeatures } from "@/pages/schoolpro/SchoolProFeatures";
import { SchoolProResultManagement } from "@/pages/schoolpro/SchoolProResultManagement";
import { SchoolProPricing } from "@/pages/schoolpro/SchoolProPricing";
import { SchoolProBookDemo } from "@/pages/schoolpro/SchoolProBookDemo";
import { SchoolProRegister } from "@/pages/schoolpro/SchoolProRegister";
import { SchoolProFaq } from "@/pages/schoolpro/SchoolProFaq";
import { SchoolProSupport } from "@/pages/schoolpro/SchoolProSupport";
import { SchoolProLogin } from "@/pages/schoolpro/SchoolProLogin";
import { SchoolProResultChecker } from "@/pages/schoolpro/SchoolProResultChecker";
import { SchoolProProprietorDashboard } from "@/pages/schoolpro/SchoolProProprietorDashboard";
import { SchoolProAdminDashboard } from "@/pages/schoolpro/SchoolProAdminDashboard";
import { SchoolProStudents } from "@/pages/schoolpro/SchoolProStudents";
import { SchoolProResults } from "@/pages/schoolpro/SchoolProResults";
import { SchoolProFees } from "@/pages/schoolpro/SchoolProFees";
import { SchoolProReportCard } from "@/pages/schoolpro/SchoolProReportCard";
import { SchoolProStaff } from "@/pages/schoolpro/SchoolProStaff";

const SchoolProResultTemplates = lazy(() => import("@/pages/schoolpro/SchoolProResultTemplates").then((module) => ({ default: module.SchoolProResultTemplates })));
import { SchoolProClasses } from "@/pages/schoolpro/SchoolProClasses";
import { SchoolProSubjects } from "@/pages/schoolpro/SchoolProSubjects";
import { SchoolProAttendance } from "@/pages/schoolpro/SchoolProAttendance";
import { SchoolProTeacherDashboard } from "@/pages/schoolpro/SchoolProTeacherDashboard";
import { SchoolProParentDashboard } from "@/pages/schoolpro/SchoolProParentDashboard";
import { SchoolProParents } from "@/pages/schoolpro/SchoolProParents";
import { SchoolProReceipt } from "@/pages/schoolpro/SchoolProReceipt";
import { SchoolProStudentDashboard } from "@/pages/schoolpro/SchoolProStudentDashboard";
import { SchoolProModulePage } from "@/pages/schoolpro/SchoolProModulePage";
import { SchoolProQuestionBank } from "@/pages/schoolpro/SchoolProQuestionBank";
import { SchoolProBrandingSettings } from "@/pages/schoolpro/SchoolProBrandingSettings";
import { SchoolProAdmissions } from "@/pages/schoolpro/SchoolProAdmissions";
import { SchoolProRoles } from "@/pages/schoolpro/SchoolProRoles";
import { SchoolProPublicAdmission } from "@/pages/schoolpro/SchoolProPublicAdmission";
import { SchoolProCBTRunner } from "@/pages/schoolpro/SchoolProCBTRunner";
import { SchoolProCBTManager } from "@/pages/schoolpro/SchoolProCBTManager";
import { SchoolProStudentCBT } from "@/pages/schoolpro/SchoolProStudentCBT";
import { SchoolProStudentPortalView } from "@/pages/schoolpro/SchoolProStudentPortalView";
import { SchoolProCustomRequest } from "@/pages/schoolpro/SchoolProCustomRequest";
import { SchoolProSchoolSite } from "@/pages/schoolpro/SchoolProSchoolSite";
import { SchoolProAdmissionOffer } from "@/pages/schoolpro/SchoolProAdmissionOffer";
import { SchoolProCandidateCBT } from "@/pages/schoolpro/SchoolProCandidateCBT";
import { SchoolProAdmissionsWorkspace } from "@/pages/schoolpro/SchoolProAdmissionsWorkspace";
import { SchoolProOperations } from "@/pages/schoolpro/SchoolProOperations";
import { SchoolProOperationalModule } from "@/pages/schoolpro/SchoolProOperationalModule";
import { SchoolProBroadsheet } from "@/pages/schoolpro/SchoolProBroadsheet";
import { SchoolProEntitlementGate } from "@/components/SchoolProEntitlementGate";
import { SchoolProDocumentStudio } from "@/pages/schoolpro/SchoolProDocumentStudio";
import { SchoolProDocumentVerification } from "@/pages/schoolpro/SchoolProDocumentVerification";

import { ConsultHome } from "@/pages/consult/ConsultHome";
import { ConsultServices } from "@/pages/consult/ConsultServices";
import { ConsultServiceCategory } from "@/pages/consult/ConsultServiceCategory";
import { ConsultHire } from "@/pages/consult/ConsultHire";
import { ConsultPortfolio } from "@/pages/consult/ConsultPortfolio";
import { ConsultCaseStudy } from "@/pages/consult/ConsultCaseStudy";
import { ConsultQuote } from "@/pages/consult/ConsultQuote";
import { ConsultBook } from "@/pages/consult/ConsultBook";
import { ConsultPortal } from "@/pages/consult/ConsultPortal";
import { ConsultProjectPage } from "@/pages/consult/ConsultProjectPage";
import { ConsultSupport } from "@/pages/consult/ConsultSupport";
import {
  HostHome,
  DomainSearch,
  HostingCatalog,
  HostOrder,
  HostDashboard,
  HostSupport,
} from "@/pages/host/HostPlatform";
import {
  EngineeringHome,
  EngineeringService,
} from "@/pages/engineering/EngineeringPlatform";
import {
  EngineeringQuoteLive,
  EngineeringDashboardLive,
  EngineeringSupportLive,
} from "@/pages/engineering/EngineeringOperations";

import { SignInPage } from "@/pages/auth/SignInPage";
import { OperationsHub } from "@/pages/OperationsHub";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { UpdatePasswordPage } from "@/pages/auth/UpdatePasswordPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { AuthHandoffPage } from "@/pages/auth/AuthHandoffPage";
import { AccountPage } from "@/pages/account/AccountPage";
import { NotificationsPage } from "@/pages/account/NotificationsPage";
import { ProfilePage } from "@/pages/account/ProfilePage";
import { BillingPage } from "@/pages/account/BillingPage";
import { AccountSupportPage } from "@/pages/account/AccountSupportPage";
import { AccountSecurityPage } from "@/pages/account/AccountSecurityPage";
import { ProductWelcomeTour } from "@/pages/onboarding/ProductWelcomeTour";

import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminModulePage } from "@/pages/admin/AdminModulePage";
import { AdminStatePage } from "@/pages/admin/AdminStatePage";
import { AdminLivePage } from "@/pages/admin/AdminLivePage";
import { AdminContentManager } from "@/pages/admin/AdminContentManager";
import { AdminDataSubPage } from "@/pages/admin/AdminDataSubPage";
import { AdminDataSubProviderPricing } from "@/pages/admin/AdminDataSubProviderPricing";
import { AdminHostPage } from "@/pages/admin/AdminHostPage";
import { AdminConsultPage } from "@/pages/admin/AdminConsultPage";
import { AdminEngineeringPage } from "@/pages/admin/AdminEngineeringPage";
import { AdminBusinessPage } from "@/pages/admin/AdminBusinessPage";
import { AdminSupportPage } from "@/pages/admin/AdminSupportPage";
import { AdminFinancePage } from "@/pages/admin/AdminFinancePage";
import { AdminNotificationsPage } from "@/pages/admin/AdminNotificationsPage";
import { AdminSecurityPage } from "@/pages/admin/AdminSecurityPage";
import { AdminReadinessPage } from "@/pages/admin/AdminReadinessPage";
import { AdminIntegrationsPage } from "@/pages/admin/AdminIntegrationsPage";
import { AdminSchoolProCustomRequests } from "@/pages/admin/AdminSchoolProCustomRequests";

import { BusinessCentreHome } from "@/pages/business-centre/BusinessCentreHome";
import { PrintBrandingHome } from "@/pages/print/PrintBrandingHome";
import { BusinessUnitPage, BusinessCustomerWorkspace } from "@/pages/business-centre/BusinessOperations";
import { NotFoundPage } from "@/pages/NotFoundPage";

const platformLanding = deployedPlatform==="datasub"?<DataSubHome/>:deployedPlatform==="schoolpro"?<SchoolProHome/>:deployedPlatform==="consult"?<ConsultHome/>:deployedPlatform==="engineering"?<EngineeringHome/>:deployedPlatform==="host"?<HostHome/>:deployedPlatform==="print"?<PrintBrandingHome/>:deployedPlatform==="fabrication"?<BusinessUnitPage unit="fabrication"/>:deployedPlatform==="compute"?<BusinessUnitPage unit="compute"/>:deployedPlatform==="academy"?<BusinessUnitPage unit="academy"/>:deployedPlatform==="digital_business"?<BusinessUnitPage unit="digital_business"/>:deployedPlatform==="business_centre"?<BusinessCentreHome/>:deployedPlatform==="admin"?<Navigate to="/admin" replace/>:<CorporateHome/>;

export default function App() {
  return (
    <ToastProvider>
      <BrandIntro>
        <Routes>
          {/* Corporate */}
          <Route path="/" element={platformLanding} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/case-studies" element={<CaseStudiesPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/article" element={<BlogArticlePage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* Business & Innovation Centre */}
          <Route path="/business-centre" element={<BusinessCentreHome />} />
          <Route path="/print" element={<PrintBrandingHome />} />
          <Route path="/print/order" element={<ProtectedRoute product="print" requireServiceAccess><BusinessUnitPage unit="print" /></ProtectedRoute>} />
          <Route path="/fabrication" element={<BusinessUnitPage unit="fabrication" />} />
          <Route path="/compute" element={<BusinessUnitPage unit="compute" />} />
          <Route path="/academy" element={<BusinessUnitPage unit="academy" />} />
          <Route path="/business-centre/digital-services" element={<BusinessUnitPage unit="digital_business" />} />
          <Route path="/business-centre/workspace" element={<ProtectedRoute product="business_centre" requireServiceAccess><BusinessCustomerWorkspace /></ProtectedRoute>} />

          {/* DataSub */}
          <Route path="/datasub" element={<DataSubHome />} />
          <Route path="/datasub/airtime" element={<DataSubAirtime />} />
          <Route path="/datasub/data-plans" element={<DataSubDataPlans />} />
          <Route path="/datasub/electricity" element={<DataSubElectricity />} />
          <Route path="/datasub/cable" element={<DataSubCable />} />
          <Route path="/datasub/education" element={<DataSubEducation />} />
          <Route path="/datasub/reseller" element={<DataSubReseller />} />
          <Route path="/datasub/api" element={<DataSubApi />} />
          <Route path="/datasub/pricing" element={<DataSubPricing />} />
          <Route path="/datasub/faq" element={<DataSubFaq />} />
          <Route path="/datasub/support" element={<DataSubSupport />} />
          <Route path="/datasub/airtime-to-cash" element={<DataSubAirtimeToCash />} />
          <Route path="/datasub/print-cards" element={<DataSubPrintCards />} />
          <Route path="/datasub/services" element={<ProtectedRoute product="datasub" requireServiceAccess><DataSubServices /></ProtectedRoute>} />
          <Route path="/datasub/customer-tools" element={<ProtectedRoute product="datasub" requireServiceAccess><DataSubCustomerTools /></ProtectedRoute>} />
          <Route
            path="/datasub/dashboard"
            element={
              <ProtectedRoute product="datasub" requireServiceAccess>
                <DataSubDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasub/wallet"
            element={
              <ProtectedRoute product="datasub" requireServiceAccess>
                <DataSubWallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasub/transactions"
            element={
              <ProtectedRoute product="datasub" requireServiceAccess>
                <DataSubTransactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasub/buy-airtime"
            element={<Navigate to="/datasub/buy/airtime" replace />}
          />
          <Route
            path="/datasub/buy-data"
            element={<Navigate to="/datasub/buy/data" replace />}
          />
          <Route
            path="/datasub/pay-electricity"
            element={<Navigate to="/datasub/buy/electricity" replace />}
          />
          <Route
            path="/datasub/pay-cable"
            element={<Navigate to="/datasub/buy/cable" replace />}
          />
          <Route
            path="/datasub/buy-education"
            element={<Navigate to="/datasub/buy/education" replace />}
          />
          <Route
            path="/datasub/buy/airtime"
            element={
              <ProtectedRoute product="datasub" requireServiceAccess>
                <PurchaseFlow service="airtime" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasub/buy/data"
            element={
              <ProtectedRoute product="datasub" requireServiceAccess>
                <PurchaseFlow service="data" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasub/buy/electricity"
            element={
              <ProtectedRoute product="datasub" requireServiceAccess>
                <PurchaseFlow service="electricity" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasub/buy/cable"
            element={
              <ProtectedRoute product="datasub" requireServiceAccess>
                <PurchaseFlow service="cable" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasub/buy/education"
            element={
              <ProtectedRoute product="datasub" requireServiceAccess>
                <PurchaseFlow service="education" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasub/reseller-dashboard"
            element={
              <ProtectedRoute product="datasub" requireServiceAccess>
                <DataSubResellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasub/upgrade"
            element={<ProtectedRoute product="datasub" requireServiceAccess><DataSubUpgrade /></ProtectedRoute>}
          />
          <Route
            path="/datasub/api-dashboard"
            element={
              <ProtectedRoute product="datasub" requireServiceAccess>
                <DataSubApiDashboard />
              </ProtectedRoute>
            }
          />

          {/* SchoolPro */}
          <Route path="/schoolpro" element={<SchoolProHome />} />
          <Route path="/schoolpro/apply" element={<SchoolProPublicAdmission />} />
          <Route path="/schoolpro/verify-document" element={<SchoolProDocumentVerification />} />
          <Route path="/school/:slug" element={<SchoolProSchoolSite />} />
          <Route path="/schoolpro/admission/offer/:token" element={<SchoolProAdmissionOffer />} />
          <Route path="/schoolpro/admission/cbt/:token" element={<SchoolProCandidateCBT />} />
          <Route path="/schoolpro/admissions" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProAdmissions /></ProtectedRoute>} />
          <Route path="/schoolpro/admissions/workspace" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProAdmissionsWorkspace /></ProtectedRoute>} />
          <Route path="/schoolpro/operations" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperations /></ProtectedRoute>} />
          <Route path="/schoolpro/broadsheet" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProEntitlementGate feature="advanced_reports"><SchoolProBroadsheet /></SchoolProEntitlementGate></ProtectedRoute>} />
          <Route path="/schoolpro/timetable" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProModulePage module="timetable" /></ProtectedRoute>} />
          <Route path="/schoolpro/assignments" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProModulePage module="assignments" /></ProtectedRoute>} />
          <Route path="/schoolpro/announcements" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProModulePage module="announcements" /></ProtectedRoute>} />
          <Route path="/schoolpro/roles-permissions" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProRoles /></ProtectedRoute>} />
          <Route path="/schoolpro/settings" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProEntitlementGate feature="custom_branding"><SchoolProBrandingSettings /></SchoolProEntitlementGate></ProtectedRoute>} />
          <Route path="/schoolpro/library" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="library" /></ProtectedRoute>} />
          <Route path="/schoolpro/transport" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="transport" /></ProtectedRoute>} />
          <Route path="/schoolpro/hostel" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="hostel" /></ProtectedRoute>} />
          <Route path="/schoolpro/inventory" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="inventory" /></ProtectedRoute>} />
          <Route path="/schoolpro/payroll" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="payroll" /></ProtectedRoute>} />
          <Route path="/schoolpro/discipline" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="discipline" /></ProtectedRoute>} />
          <Route path="/schoolpro/calendar" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="calendar" /></ProtectedRoute>} />
          <Route path="/schoolpro/lesson-notes" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="lesson-notes" /></ProtectedRoute>} />
          <Route path="/schoolpro/leave" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="leave" /></ProtectedRoute>} />
          <Route path="/schoolpro/promotions" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="promotions" /></ProtectedRoute>} />
          <Route path="/schoolpro/medical" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProOperationalModule kind="medical" /></ProtectedRoute>} />\n          <Route path="/schoolpro/documents" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProDocumentStudio /></ProtectedRoute>} />
          <Route path="/schoolpro/custom" element={<SchoolProCustomRequest />} />
          <Route path="/schoolpro/student-cbt" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProEntitlementGate feature="cbt"><SchoolProStudentCBT /></SchoolProEntitlementGate></ProtectedRoute>} />
          <Route path="/schoolpro/question-bank" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProEntitlementGate feature="cbt"><SchoolProQuestionBank /></SchoolProEntitlementGate></ProtectedRoute>} />
          <Route path="/schoolpro/cbt" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProEntitlementGate feature="cbt"><SchoolProCBTManager /></SchoolProEntitlementGate></ProtectedRoute>} />
          <Route path="/schoolpro/cbt/take/:testId" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProEntitlementGate feature="cbt"><SchoolProCBTRunner /></SchoolProEntitlementGate></ProtectedRoute>} />
          <Route path="/schoolpro/features" element={<SchoolProFeatures />} />
          <Route
            path="/schoolpro/result-management"
            element={<SchoolProResultManagement />}
          />
          <Route path="/schoolpro/pricing" element={<SchoolProPricing />} />
          <Route path="/schoolpro/book-demo" element={<SchoolProBookDemo />} />
          <Route path="/schoolpro/register" element={<SchoolProRegister />} />
          <Route path="/schoolpro/faq" element={<SchoolProFaq />} />
          <Route path="/schoolpro/support" element={<SchoolProSupport />} />
          <Route
            path="/schoolpro/login"
            element={<SchoolProLogin role="school" />}
          />
          <Route
            path="/schoolpro/parent-login"
            element={<SchoolProLogin role="parent" />}
          />
          <Route
            path="/schoolpro/student-login"
            element={<SchoolProLogin role="student" />}
          />
          <Route
            path="/schoolpro/teacher-login"
            element={<SchoolProLogin role="teacher" />}
          />
          <Route
            path="/schoolpro/result-checker"
            element={<SchoolProResultChecker />}
          />
          <Route
            path="/schoolpro/proprietor-dashboard"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProProprietorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/admin-dashboard"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/students"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/results"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/result-templates"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <Suspense fallback={<div className="p-6 text-sm text-muted">Loading result templates…</div>}><SchoolProResultTemplates /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/fees"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProFees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/receipts/:receiptId"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProReceipt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/staff"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/classes"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/subjects"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProSubjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/attendance"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/parents"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProParents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/report-card"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProReportCard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/teacher-dashboard"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProTeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/parent-dashboard"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schoolpro/student-dashboard"
            element={
              <ProtectedRoute product="schoolpro" requireServiceAccess>
                <SchoolProStudentDashboard />
              </ProtectedRoute>
            }
          />
          {["results","assignments","attendance","timetable","library","announcements"].map((studentView) => (
            <Route key={studentView} path={`/schoolpro/student-${studentView}`} element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProStudentPortalView kind={studentView} /></ProtectedRoute>} />
          ))}
          <Route path="/schoolpro/reports" element={<ProtectedRoute product="schoolpro" requireServiceAccess><SchoolProEntitlementGate feature="advanced_reports"><SchoolProModulePage module="reports" /></SchoolProEntitlementGate></ProtectedRoute>} />

          {/* Consult */}
          <Route path="/consult" element={<ConsultHome />} />
          <Route path="/consult/services" element={<ConsultServices />} />
          <Route
            path="/consult/services/web-mobile"
            element={<ConsultServiceCategory category="web-mobile" />}
          />
          <Route
            path="/consult/services/ai-ml"
            element={<ConsultServiceCategory category="ai-ml" />}
          />
          <Route
            path="/consult/services/cloud-devops"
            element={<ConsultServiceCategory category="cloud-devops" />}
          />
          <Route
            path="/consult/services/engineering"
            element={<ConsultServiceCategory category="engineering" />}
          />
          <Route path="/consult/hire" element={<ConsultHire />} />
          <Route path="/consult/portfolio" element={<ConsultPortfolio />} />
          <Route
            path="/consult/portfolio/case-study"
            element={<ConsultCaseStudy />}
          />
          <Route path="/consult/quote" element={<ConsultQuote />} />
          <Route path="/consult/book" element={<ConsultBook />} />
          <Route path="/consult/support" element={<ConsultSupport />} />
          <Route path="/consult/operations" element={<ProtectedRoute product="consult" requireServiceAccess><OperationsHub platform="consult" /></ProtectedRoute>} />
          <Route
            path="/consult/portal"
            element={
              <ProtectedRoute product="consult" requireServiceAccess>
                <ConsultPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consult/portal/projects/:id"
            element={
              <ProtectedRoute product="consult" requireServiceAccess>
                <ConsultProjectPage />
              </ProtectedRoute>
            }
          />
          <Route path="/host" element={<HostHome />} />
          <Route path="/host/domains" element={<DomainSearch />} />
          <Route path="/host/hosting" element={<HostingCatalog />} />
          <Route
            path="/host/reseller"
            element={<HostingCatalog type="reseller" />}
          />
          <Route path="/host/vps" element={<HostingCatalog type="vps" />} />
          <Route
            path="/host/dedicated"
            element={<HostingCatalog type="dedicated" />}
          />
          <Route
            path="/host/order"
            element={
              <ProtectedRoute product="host" requireServiceAccess>
                <HostOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/dashboard"
            element={
              <ProtectedRoute product="host" requireServiceAccess>
                <HostDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/dashboard/domains"
            element={
              <ProtectedRoute product="host" requireServiceAccess>
                <HostDashboard view="domains" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/dashboard/services"
            element={
              <ProtectedRoute product="host" requireServiceAccess>
                <HostDashboard view="services" />
              </ProtectedRoute>
            }
          />
          <Route path="/host/dashboard/operations" element={<ProtectedRoute product="host" requireServiceAccess><HostDashboard view="operations" /></ProtectedRoute>} />
          <Route path="/host/support" element={<HostSupport />} />

          {/* Engineering */}
          <Route path="/engineering" element={<EngineeringHome />} />
          {["control", "robotics", "instrumentation", "networking"].map(
            (type) => (
              <Route
                key={type}
                path={`/engineering/${type}`}
                element={<EngineeringService type={type} />}
              />
            ),
          )}
          <Route path="/engineering/quote" element={<EngineeringQuoteLive />} />
          <Route path="/engineering/portfolio" element={<EngineeringHome />} />
          <Route
            path="/engineering/dashboard"
            element={
              <ProtectedRoute product="engineering" requireServiceAccess>
                <EngineeringDashboardLive />
              </ProtectedRoute>
            }
          />
          <Route path="/engineering/support" element={<EngineeringSupportLive />} />
          <Route path="/engineering/operations" element={<ProtectedRoute product="engineering" requireServiceAccess><OperationsHub platform="engineering" /></ProtectedRoute>} />

          {/* Auth */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/handoff" element={<AuthHandoffPage />} />
          <Route path="/welcome-tour" element={<ProductWelcomeTour />} />

          {/* Account */}
          <Route
            path="/dashboard"
            element={<Navigate to="/account" replace />}
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
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
          <Route path="/account/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
          <Route path="/account/support" element={<ProtectedRoute><AccountSupportPage /></ProtectedRoute>} />
          <Route path="/account/security" element={<ProtectedRoute><AccountSecurityPage /></ProtectedRoute>} />
          <Route
            path="/account/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Central Super Admin */}
          <Route path="/admin/login" element={<SignInPage />} />
          <Route path="/admin/schoolpro/custom-requests" element={<ProtectedRoute roles={["super_admin"]}><AdminSchoolProCustomRequests /></ProtectedRoute>} />
          <Route path="/admin/verify" element={<Navigate to="/admin/login" replace />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["super_admin", "platform_admin", "support", "finance"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedRoute roles={["super_admin", "platform_admin", "support", "finance"]} product="corporate" permission="website_builder">
                <AdminContentManager />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/business-centre" element={<ProtectedRoute roles={["super_admin","platform_admin","support","finance"]} product="business_centre" permission="manage"><AdminBusinessPage /></ProtectedRoute>} />
          <Route path="/admin/print" element={<ProtectedRoute roles={["super_admin","platform_admin","support","finance"]} product="print" permission="manage"><AdminBusinessPage unit="print" /></ProtectedRoute>} />
          <Route path="/admin/fabrication" element={<ProtectedRoute roles={["super_admin","platform_admin","support","finance"]} product="fabrication" permission="manage"><AdminBusinessPage unit="fabrication" /></ProtectedRoute>} />
          <Route path="/admin/compute" element={<ProtectedRoute roles={["super_admin","platform_admin","support","finance"]} product="compute" permission="manage"><AdminBusinessPage unit="compute" /></ProtectedRoute>} />
          <Route path="/admin/academy" element={<ProtectedRoute roles={["super_admin","platform_admin","support","finance"]} product="academy" permission="manage"><AdminBusinessPage unit="academy" /></ProtectedRoute>} />
          <Route path="/admin/digital-business" element={<ProtectedRoute roles={["super_admin","platform_admin","support","finance"]} product="digital_business" permission="manage"><AdminBusinessPage unit="digital_business" /></ProtectedRoute>} />
          {[
            "products",
            "pricing",
            "administrators",
            "roles",
            "customers",
            "datasub",
            "schoolpro",
            "consult",
            "host",
            "engineering",
            "business-centre","print","fabrication","compute","academy","digital-business",
            "finance",
            "support",
            "notifications",
            "security",
            "readiness",
            "audit-logs",
            "integrations",
            "settings",
          ].map((module) => (
            <Route
              key={module}
              path={`/admin/${module}`}
              element={
                <ProtectedRoute
                  roles={
                    (
                      [
                        "administrators",
                        "roles",
                        "customers",
                        "pricing",
                        "audit-logs",
                      ] as string[]
                    ).includes(module)
                      ? ["super_admin"]
                      : ["super_admin", "platform_admin", "support", "finance"]
                  }
                  product={
                    module === "support" || module === "finance" || module === "notifications" || module === "security" || module === "readiness"
                      ? "corporate"
                      : (
                          {
                            datasub: "datasub",
                            schoolpro: "schoolpro",
                            consult: "consult",
                            host: "host",
                            engineering: "engineering",
                          } as const
                        )[
                          module as
                            | "datasub"
                            | "schoolpro"
                            | "consult"
                            | "host"
                            | "engineering"
                        ]
                  }
                >
                  {(
                    [
                      "administrators",
                      "roles",
                      "customers",
                      "pricing",
                      "audit-logs",
                    ] as string[]
                  ).includes(module) ? (
                    <AdminLivePage
                      module={
                        module as
                          | "administrators"
                          | "roles"
                          | "customers"
                          | "pricing"
                          | "audit-logs"
                      }
                    />
                  ) : module === "datasub" ? (
                    <AdminDataSubPage />
                  ) : module === "host" ? (
                    <AdminHostPage />
                  ) : module === "consult" ? (
                    <AdminConsultPage />
                  ) : module === "engineering" ? (
                    <AdminEngineeringPage />
                  ) : module === "support" ? (
                    <AdminSupportPage />
                  ) : module === "finance" ? (
                    <AdminFinancePage />
                  ) : module === "notifications" ? (
                    <AdminNotificationsPage />
                  ) : module === "security" ? (
                    <AdminSecurityPage />
                  ) : module === "readiness" ? (
                    <AdminReadinessPage />
                  ) : module === "integrations" ? (
                    <AdminIntegrationsPage />
                  ) : (
                    <AdminModulePage module={module} />
                  )}
                </ProtectedRoute>
              }
            />
          ))}
          <Route path="/admin/datasub/provider-pricing" element={<ProtectedRoute roles={["super_admin","platform_admin"]} product="datasub"><AdminDataSubProviderPricing /></ProtectedRoute>} />
          <Route
            path="/admin/datasub/transactions"
            element={
              <ProtectedRoute
                roles={["super_admin", "platform_admin", "support", "finance"]}
                product="datasub"
              >
                <AdminModulePage module="datasub" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/schools"
            element={
              <ProtectedRoute
                roles={["super_admin", "platform_admin", "support", "finance"]}
                product="schoolpro"
              >
                <AdminModulePage module="schoolpro" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subscriptions"
            element={
              <ProtectedRoute
                roles={["super_admin", "platform_admin", "support", "finance"]}
                product="schoolpro"
              >
                <AdminModulePage module="schoolpro" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leads"
            element={
              <ProtectedRoute
                roles={["super_admin", "platform_admin", "support", "finance"]}
                product="consult"
              >
                <AdminConsultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute
                roles={["super_admin", "platform_admin", "support", "finance"]}
                product="consult"
              >
                <AdminConsultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute roles={["super_admin", "platform_admin", "support", "finance"]}>
                <AdminModulePage module="finance" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/access-denied"
            element={<AdminStatePage state="access" />}
          />
          <Route
            path="/admin/session-expired"
            element={<AdminStatePage state="session" />}
          />
          <Route
            path="/admin/system-error"
            element={<AdminStatePage state="error" />}
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrandIntro>
    </ToastProvider>
  );
}
