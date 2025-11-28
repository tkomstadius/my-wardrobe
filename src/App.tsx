import { Route, Routes } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { AddItemPage } from './pages/AddItemPage';
import { EditItemPage } from './pages/EditItemPage';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="add-item" element={<AddItemPage />} />
        <Route path="edit-item/:id" element={<EditItemPage />} />
      </Route>
    </Routes>
  );
}

export default App;
