"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import {
  IconPlus,
  IconSearch,
  IconBox,
  IconTrash,
  IconEdit,
  IconCheck,
  IconX,
  IconLock
} from "@tabler/icons-react";

export default function ProducerProducts() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.get("/producer/products");
        setProducts(data || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchProducts();
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductCat, setNewProductCat] = useState("Cosmetics");
  const [productImage, setProductImage] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductSku, setEditProductSku] = useState("");
  const [editProductCat, setEditProductCat] = useState("Cosmetics");
  const [editProductImage, setEditProductImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditProductClick = (p: any) => {
    setEditingProductId(p.id);
    setEditProductName(p.name);
    setEditProductSku(p.sku);
    setEditProductCat(p.category);
    setEditProductImage(p.image_url || "");
    setIsEditModalOpen(true);
  };

  const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      
      try {
        const data = await api.upload("/producer/upload", formData);
        setEditProductImage(data.url);
      } catch (err) {
        console.error("Upload connection error:", err);
        alert("Upload server is currently unreachable. Image preview disabled.");
      }
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProductId && editProductName && editProductSku) {
      try {
        setIsSubmitting(true);
        const updated = await api.put(`/producer/products/${editingProductId}`, {
          name: editProductName,
          sku: editProductSku.toUpperCase(),
          category: editProductCat,
          description: "Registered Product SKU",
          image_url: editProductImage || "/logo.png"
        });
        setProducts(products.map(p => p.id === editingProductId ? updated : p));
        setIsEditModalOpen(false);
      } catch (err: any) {
        alert(err.message || "Failed to update product.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteProduct = async (p: any) => {
    const confirmDelete = window.confirm(
      `⚠️ WARNING: Are you sure you want to delete product "${p.name}" (${p.sku})?\n\nThis will instantly and permanently delete ALL batches, QR codes, scan histories, and counterfeit reports associated with this product. This action CANNOT be undone.`
    );
    if (!confirmDelete) return;

    try {
      setIsSubmitting(true);
      await api.delete(`/producer/products/${p.id}`);
      setProducts(products.filter(item => item.id !== p.id));
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      
      try {
        const data = await api.upload("/producer/upload", formData);
        setProductImage(data.url);
      } catch (err) {
        console.error("Upload connection error:", err);
        alert("Upload server is currently unreachable. Image preview disabled.");
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProductName && newProductSku) {
      try {
        setIsSubmitting(true);
        const created = await api.post("/producer/products", {
          name: newProductName,
          sku: newProductSku.toUpperCase(),
          category: newProductCat,
          description: "Registered Product SKU",
          image_url: productImage || "/logo.png"
        });
        setProducts([...products, created]);
        setNewProductName("");
        setNewProductSku("");
        setProductImage("");
        setIsAddModalOpen(false);
      } catch (err: any) {
        alert(err.message || "Failed to create product.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-display">Product Catalog</h2>
          <p className="text-slate-500 font-medium mt-1">
            Register and manage your products to issue unique QR authentication tokens.
          </p>
        </div>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-5 py-3 rounded-full text-xs shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <IconPlus className="w-4 h-4" />
          Add Product SKU
        </button>
      </div>

      {/* Catalog Table Card */}
      <div className="bg-white border border-slate-200/60 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search catalog..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ahnara-brand focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Product Name</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">SKU Code</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Category</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Total Scans</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Status</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider">Registered</th>
                <th className="p-4 font-mono uppercase text-slate-400 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <IconBox className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    {p.name}
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-600">{p.sku}</td>
                  <td className="p-4 font-bold text-slate-500">{p.category}</td>
                  <td className="p-4 font-bold text-slate-700">{((p.scans || 0) as number).toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-black uppercase">
                      {p.status || "Active"}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-400">
                    {p.created_at 
                      ? new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                      : p.date || "---"}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => handleEditProductClick(p)}
                        disabled={isSubmitting}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p)}
                        disabled={isSubmitting}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-2xl relative z-10 text-left flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800 text-display">Register Product SKU</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Product Name</label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. AURA Skincare Gel Cream"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ahnara-brand focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">SKU Code (Must be unique)</label>
                  <input
                    type="text"
                    value={newProductSku}
                    onChange={(e) => setNewProductSku(e.target.value)}
                    placeholder="e.g. AURA-GEL-CREAM-30"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ahnara-brand focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Category</label>
                  <select
                    value={newProductCat}
                    onChange={(e) => setNewProductCat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-ahnara-brand focus:bg-white"
                  >
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Pharma">Pharmaceuticals</option>
                    <option value="Consumer Goods">Consumer Goods</option>
                    <option value="Chemicals">Chemicals</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Product Image</label>
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      {productImage ? (
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 relative group">
                          <img src={productImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProductImage("")}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <IconX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-400 border border-slate-300">
                          <IconBox className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <input
                          type="text"
                          value={productImage}
                          onChange={(e) => setProductImage(e.target.value)}
                          placeholder="Image URL (e.g. /product.png)"
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ahnara-brand"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Or</span>
                          <label className="text-[10px] text-[#0089C1] hover:underline font-bold cursor-pointer">
                            Upload File...
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold py-3.5 rounded-full text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Registering..." : "Register SKU"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-2xl relative z-10 text-left flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800 text-display">Edit Product SKU</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditProductSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    placeholder="e.g. AURA Skincare Gel Cream"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ahnara-brand focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">SKU Code (Must be unique)</label>
                  <input
                    type="text"
                    value={editProductSku}
                    onChange={(e) => setEditProductSku(e.target.value)}
                    placeholder="e.g. AURA-GEL-CREAM-30"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ahnara-brand focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Category</label>
                  <select
                    value={editProductCat}
                    onChange={(e) => setEditProductCat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-ahnara-brand focus:bg-white"
                  >
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Pharma">Pharmaceuticals</option>
                    <option value="Consumer Goods">Consumer Goods</option>
                    <option value="Chemicals">Chemicals</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Product Image</label>
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      {editProductImage ? (
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 relative group">
                          <img src={editProductImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditProductImage("")}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <IconX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-400 border border-slate-300">
                          <IconBox className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <input
                          type="text"
                          value={editProductImage}
                          onChange={(e) => setEditProductImage(e.target.value)}
                          placeholder="Image URL (e.g. /product.png)"
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-ahnara-brand"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Or</span>
                          <label className="text-[10px] text-[#0089C1] hover:underline font-bold cursor-pointer">
                            Upload File...
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditImageChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-bold py-3.5 rounded-full text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold py-3.5 rounded-full text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
