import { createBrowserRouter, RouterProvider } from "react-router";
import { MainLayout } from "./components/layout/MainLayout";
import {
  AddItemPage,
  clientAction as addItemAction,
} from "./pages/AddItemPage";
import { CategoryPage, loader as categoryLoader } from "./pages/CategoryPage";
import { EditItemPage } from "./pages/EditItemPage";
import {
  ItemDetailPage,
  loader as itemDetailLoader,
} from "./pages/ItemDetailPage";
import { HomePage, loader as homeLoader } from "./pages/HomePage";
import { ItemsPage, loader as itemsLoader } from "./pages/ItemsPage";
import { LogWearPage } from "./pages/LogWearPage";
import { OutfitsPage } from "./pages/OutfitsPage";
import { CreateOutfitPage } from "./pages/CreateOutfitPage";
import { OutfitDetailPage } from "./pages/OutfitDetailPage";
import { EditOutfitPage } from "./pages/EditOutfitPage";
import { SettingsPage } from "./pages/SettingsPage";

// Create router with data router support (required for loaders/actions)
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage />, loader: homeLoader },
      { path: "add-item", element: <AddItemPage />, action: addItemAction },
      { path: "items", element: <ItemsPage />, loader: itemsLoader },
      { path: "log-wear", element: <LogWearPage /> },
      {
        path: "category/:category",
        element: <CategoryPage />,
        loader: categoryLoader,
      },
      {
        path: "item/:id",
        element: <ItemDetailPage />,
        loader: itemDetailLoader,
      },
      { path: "edit-item/:id", element: <EditItemPage /> },
      { path: "outfits", element: <OutfitsPage /> },
      { path: "create-outfit", element: <CreateOutfitPage /> },
      { path: "outfit/:id", element: <OutfitDetailPage /> },
      { path: "edit-outfit/:id", element: <EditOutfitPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
