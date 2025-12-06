import { Route, Routes } from "react-router";
import { MainLayout } from "./components/layout/MainLayout";
import { AddItemPage } from "./pages/AddItemPage";
import { CategoryPage } from "./pages/CategoryPage";
import { EditItemPage } from "./pages/EditItemPage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { HomePage } from "./pages/HomePage";
import { ItemsPage } from "./pages/ItemsPage";
import { OutfitsPage } from "./pages/OutfitsPage";
import { CreateOutfitPage } from "./pages/CreateOutfitPage";
import { OutfitDetailPage } from "./pages/OutfitDetailPage";
import { EditOutfitPage } from "./pages/EditOutfitPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="add-item" element={<AddItemPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="category/:category" element={<CategoryPage />} />
        <Route path="item/:id" element={<ItemDetailPage />} />
        <Route path="edit-item/:id" element={<EditItemPage />} />
        <Route path="outfits" element={<OutfitsPage />} />
        <Route path="create-outfit" element={<CreateOutfitPage />} />
        <Route path="outfit/:id" element={<OutfitDetailPage />} />
        <Route path="edit-outfit/:id" element={<EditOutfitPage />} />
      </Route>
    </Routes>
  );
}

export default App;
