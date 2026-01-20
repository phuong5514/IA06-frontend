// import React, { useState } from 'react';
// import { Download, Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
// import { useMutation } from '@tanstack/react-query';
// import api from '../config/api';
// import DashboardLayout from '../components/DashboardLayout';

// interface ImportResult {
//   success: boolean;
//   imported: {
//     categories: number;
//     items: number;
//     modifiers: number;
//   };
//   errors: string[];
// }

// const MenuBulkOps: React.FC = () => {
//   const [importResult, setImportResult] = useState<ImportResult | null>(null);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);

//   const importMutation = useMutation({
//     mutationFn: async (file: File) => {
//       const formData = new FormData();
//       formData.append('file', file);
//       const response = await api.post('/menu/import', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       return response.data;
//     },
//     onSuccess: (data: ImportResult) => {
//       setImportResult(data);
//     },
//     onError: (error: any) => {
//       setImportResult({
//         success: false,
//         imported: { categories: 0, items: 0, modifiers: 0 },
//         errors: [error.message || 'Import failed'],
//       });
//     },
//   });

//   const handleExport = () => {
//     // Create a temporary link to download the CSV
//     const link = document.createElement('a');
//     link.href = `${api.defaults.baseURL}/menu/export`;
//     link.download = 'menu_export.csv';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const handleImport = () => {
//     if (selectedFile) {
//       importMutation.mutate(selectedFile);
//     }
//   };

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       setSelectedFile(file);
//       setImportResult(null); // Clear previous results
//     }
//   };

//   return (
//     <DashboardLayout>
//       <div className="max-w-4xl">
//         <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Bulk Operations</h1>
//         <p className="text-gray-600">Import and export menu data in CSV format</p>
//       </div>

//       <div className="grid gap-6 md:grid-cols-2">
//         {/* Export Section */}
//         <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
//           <div className="p-6">
//             <div className="flex items-center gap-2 mb-2">
//               <Download className="h-5 w-5 text-blue-600" />
//               <h3 className="text-lg font-semibold text-gray-900">Export Menu Data</h3>
//             </div>
//             <p className="text-gray-600 text-sm mb-4">
//               Download all menu categories, items, and modifiers as a CSV file.
//             </p>
//             <button
//               onClick={handleExport}
//               className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
//             >
//               <Download className="h-4 w-4" />
//               Export CSV
//             </button>
//           </div>
//         </div>

//         {/* Import Section */}
//         <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
//           <div className="p-6">
//             <div className="flex items-center gap-2 mb-2">
//               <Upload className="h-5 w-5 text-green-600" />
//               <h3 className="text-lg font-semibold text-gray-900">Import Menu Data</h3>
//             </div>
//             <p className="text-gray-600 text-sm mb-4">
//               Upload a CSV file to import menu categories, items, and modifiers.
//             </p>

//             <div className="space-y-4">
//               <div>
//                 <input
//                   accept=".csv"
//                   className="hidden"
//                   id="csv-file-input"
//                   type="file"
//                   onChange={handleFileChange}
//                 />
//                 <label htmlFor="csv-file-input">
//                   <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2">
//                     <FileText className="h-4 w-4" />
//                     Choose CSV File
//                   </button>
//                 </label>
//                 {selectedFile && (
//                   <span className="ml-2 text-sm text-gray-600">{selectedFile.name}</span>
//                 )}
//               </div>

//               <button
//                 onClick={handleImport}
//                 disabled={!selectedFile || importMutation.isPending}
//                 className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
//               >
//                 {importMutation.isPending ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Importing...
//                   </>
//                 ) : (
//                   <>
//                     <Upload className="h-4 w-4" />
//                     Import CSV
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Import Results */}
//       {importResult && (
//         <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
//           <div className="p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h3>

//             <div className="space-y-4">
//               {importResult.success ? (
//                 <div className="bg-green-50 border border-green-200 rounded-md p-4">
//                   <div className="flex items-center gap-2">
//                     <CheckCircle className="h-5 w-5 text-green-600" />
//                     <p className="text-green-800 font-medium">Import completed successfully!</p>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="bg-red-50 border border-red-200 rounded-md p-4">
//                   <div className="flex items-center gap-2">
//                     <XCircle className="h-5 w-5 text-red-600" />
//                     <p className="text-red-800 font-medium">Import failed!</p>
//                   </div>
//                 </div>
//               )}

//               <div className="bg-gray-50 rounded-md p-4">
//                 <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
//                 <div className="grid grid-cols-3 gap-4 text-sm">
//                   <div>
//                     <span className="text-gray-600">Categories:</span>
//                     <span className="ml-2 font-medium">{importResult.imported.categories}</span>
//                   </div>
//                   <div>
//                     <span className="text-gray-600">Items:</span>
//                     <span className="ml-2 font-medium">{importResult.imported.items}</span>
//                   </div>
//                   <div>
//                     <span className="text-gray-600">Modifiers:</span>
//                     <span className="ml-2 font-medium">{importResult.imported.modifiers}</span>
//                   </div>
//                 </div>
//               </div>

//               {importResult.errors.length > 0 && (
//                 <div className="bg-red-50 border border-red-200 rounded-md p-4">
//                   <h4 className="font-medium text-red-900 mb-2">Errors</h4>
//                   <ul className="space-y-1">
//                     {importResult.errors.map((error, index) => (
//                       <li key={index} className="text-sm text-red-700">
//                         • {error}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* CSV Format Guide */}
//       <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
//         <div className="p-6">
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">CSV Format Guide</h3>
//           <p className="text-gray-600 text-sm mb-4">
//             Required format for CSV import files
//           </p>

//           <div className="space-y-4">
//             <div>
//               <h4 className="font-medium text-gray-900 mb-2">Required Columns</h4>
//               <div className="bg-gray-50 p-3 rounded font-mono text-sm overflow-x-auto">
//                 category_name, category_description, item_name, item_description, item_price,<br />
//                 item_image_url, item_dietary_tags, item_is_available, modifier_group_name,<br />
//                 modifier_group_type, modifier_option_name, modifier_option_price_adjustment,<br />
//                 modifier_option_is_available
//               </div>
//             </div>

//             <div>
//               <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
//               <ul className="space-y-1 text-sm text-gray-600">
//                 <li>• <strong>category_name</strong> and <strong>item_name</strong> are required</li>
//                 <li>• <strong>item_price</strong> must be a valid number (e.g., 10.99)</li>
//                 <li>• <strong>item_is_available</strong> should be "true" or "false"</li>
//                 <li>• <strong>item_dietary_tags</strong> can be semicolon-separated (e.g., "vegetarian;gluten-free")</li>
//                 <li>• Modifier fields are optional - leave blank for items without modifiers</li>
//                 <li>• <strong>modifier_group_type</strong> should be "single" or "multiple"</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default MenuBulkOps;