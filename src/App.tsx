import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import {
  AddItemPage,
  clientAction as addItemAction,
  clientLoader as addItemLoader,
} from "./pages/AddItemPage";
import {
  ItemCategoryPage,
  loader as itemCategoryLoader,
} from "./pages/ItemCategoryPage";
import {
  EditItemPage,
  clientLoader as editItemLoader,
  clientAction as editItemAction,
} from "./pages/EditItemPage";
import {
  ItemDetailPage,
  loader as itemDetailLoader,
} from "./pages/ItemDetailPage";
import { loader as editOutfitLoader } from "./pages/EditOutfitPage";
import { loader as createOutfitLoader } from "./pages/CreateOutfitPage";
import { loader as settingsLoader } from "./pages/SettingsPage";
import { HomePage, loader as homeLoader } from "./pages/HomePage";
import { ItemsPage, loader as itemsLoader } from "./pages/ItemsPage";
import { LogWearPage, loader as logWearLoader } from "./pages/LogWearPage";
import { OutfitsPage, loader as outfitsLoader } from "./pages/OutfitsPage";
import {
  CreateOutfitPage,
  action as createOutfitAction,
} from "./pages/CreateOutfitPage";
import {
  OutfitDetailPage,
  loader as outfitDetailLoader,
} from "./pages/OutfitDetailPage";
import {
  EditOutfitPage,
  action as editOutfitAction,
} from "./pages/EditOutfitPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatsPage, loader as statsLoader } from "./pages/StatsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage />, loader: homeLoader },
      {
        path: "add-item",
        element: <AddItemPage />,
        loader: addItemLoader,
        action: addItemAction,
      },
      { path: "items", element: <ItemsPage />, loader: itemsLoader },
      { path: "log-wear", element: <LogWearPage />, loader: logWearLoader },
      {
        path: "items/:category",
        element: <ItemCategoryPage />,
        loader: itemCategoryLoader,
      },
      {
        path: "item/:id",
        element: <ItemDetailPage />,
        loader: itemDetailLoader,
      },
      {
        path: "edit-item/:id",
        element: <EditItemPage />,
        loader: editItemLoader,
        action: editItemAction,
      },
      { path: "outfits", element: <OutfitsPage />, loader: outfitsLoader },
      {
        path: "create-outfit",
        element: <CreateOutfitPage />,
        loader: createOutfitLoader,
        action: createOutfitAction,
      },
      {
        path: "outfit/:id",
        element: <OutfitDetailPage />,
        loader: outfitDetailLoader,
      },
      {
        path: "edit-outfit/:id",
        element: <EditOutfitPage />,
        loader: editOutfitLoader,
        action: editOutfitAction,
      },
      { path: "stats", element: <StatsPage />, loader: statsLoader },
      { path: "settings", element: <SettingsPage />, loader: settingsLoader },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
