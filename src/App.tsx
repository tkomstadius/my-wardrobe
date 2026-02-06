import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Spinner } from './components/common/ui/Spinner';
import { MainLayout } from './components/layout/MainLayout';
import { useAuth } from './contexts/AuthContext';
import {
  AddItemPage,
  clientAction as addItemAction,
  clientLoader as addItemLoader,
} from './pages/AddItemPage';
import {
  CreateOutfitPage,
  action as createOutfitAction,
  loader as createOutfitLoader,
} from './pages/CreateOutfitPage';
import {
  EditItemPage,
  clientAction as editItemAction,
  clientLoader as editItemLoader,
} from './pages/EditItemPage';
import {
  EditOutfitPage,
  action as editOutfitAction,
  loader as editOutfitLoader,
} from './pages/EditOutfitPage';
import { HomePage, loader as homeLoader } from './pages/HomePage';
import { ItemCategoryPage, loader as itemCategoryLoader } from './pages/ItemCategoryPage';
import { ItemDetailPage, loader as itemDetailLoader } from './pages/ItemDetailPage';
import { ItemsPage, loader as itemsLoader } from './pages/ItemsPage';
import { LoginPage } from './pages/LoginPage';
import { LogWearPage, loader as logWearLoader } from './pages/LogWearPage';
import { MorePage } from './pages/MorePage';
import { OutfitDetailPage, loader as outfitDetailLoader } from './pages/OutfitDetailPage';
import { OutfitsPage, loader as outfitsLoader } from './pages/OutfitsPage';
import { SettingsPage, loader as settingsLoader } from './pages/SettingsPage';
import { StatsPage, loader as statsLoader } from './pages/StatsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage />, loader: homeLoader },
      {
        path: 'add-item',
        element: <AddItemPage />,
        loader: addItemLoader,
        action: addItemAction,
      },
      { path: 'items', element: <ItemsPage />, loader: itemsLoader },
      { path: 'log-wear', element: <LogWearPage />, loader: logWearLoader },
      {
        path: 'items/:category',
        element: <ItemCategoryPage />,
        loader: itemCategoryLoader,
      },
      {
        path: 'item/:id',
        element: <ItemDetailPage />,
        loader: itemDetailLoader,
      },
      {
        path: 'edit-item/:id',
        element: <EditItemPage />,
        loader: editItemLoader,
        action: editItemAction,
      },
      { path: 'outfits', element: <OutfitsPage />, loader: outfitsLoader },
      {
        path: 'create-outfit',
        element: <CreateOutfitPage />,
        loader: createOutfitLoader,
        action: createOutfitAction,
      },
      {
        path: 'outfit/:id',
        element: <OutfitDetailPage />,
        loader: outfitDetailLoader,
      },
      {
        path: 'edit-outfit/:id',
        element: <EditOutfitPage />,
        loader: editOutfitLoader,
        action: editOutfitAction,
      },
      { path: 'stats', element: <StatsPage />, loader: statsLoader },
      { path: 'settings', element: <SettingsPage />, loader: settingsLoader },
      { path: 'more', element: <MorePage /> },
    ],
  },
]);

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--background-color)',
        }}
      >
        <Spinner size="4" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <RouterProvider router={router} />;
}

export default App;
