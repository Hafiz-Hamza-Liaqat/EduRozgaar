import { isCareerDashboardEnabled } from '../../config/careerFeatureFlags';
import CareerDashboardPage from '../../dashboard/CareerDashboardPage';
import LegacyDashboard from './LegacyDashboard';

export default function Dashboard() {
  if (isCareerDashboardEnabled()) {
    return <CareerDashboardPage />;
  }
  return <LegacyDashboard />;
}
