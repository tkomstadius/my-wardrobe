import { Route, Routes } from "react-router";
import { MainLayout } from "./components/layout/MainLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
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

// Backup and settings functionality
function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} loader={homeLoader} />
          <Route
            path="add-item"
            element={<AddItemPage />}
            action={addItemAction}
          />
          <Route path="items" element={<ItemsPage />} loader={itemsLoader} />
          <Route path="log-wear" element={<LogWearPage />} />
          <Route
            path="category/:category"
            element={<CategoryPage />}
            loader={categoryLoader}
          />
          <Route
            path="item/:id"
            element={<ItemDetailPage />}
            loader={itemDetailLoader}
          />
          <Route path="edit-item/:id" element={<EditItemPage />} />
          <Route path="outfits" element={<OutfitsPage />} />
          <Route path="create-outfit" element={<CreateOutfitPage />} />
          <Route path="outfit/:id" element={<OutfitDetailPage />} />
          <Route path="edit-outfit/:id" element={<EditOutfitPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
