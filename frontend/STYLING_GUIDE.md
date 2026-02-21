# Login/Sign-Up Page Styling Guide

This guide shows you exactly where to change height, width, padding, and spacing for each component in `frontend/src/pages/LoginPage.jsx`.

## 📐 Main Container & Card

### Page Container (Line 127)
```jsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
```
- `p-4` - Outer padding (change to `p-6`, `p-8`, etc.)
- `min-h-screen` - Minimum height (full screen)

### Main Card (Line 178)
```jsx
className="relative w-full max-w-[460px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
```
- `max-w-[460px]` - **CARD WIDTH** (change to `max-w-[420px]`, `max-w-[480px]`, etc.)
- `rounded-2xl` - Border radius (change to `rounded-xl`, `rounded-3xl`, etc.)
- `bg-white/90` - Background opacity

---

## 🎨 Header Section (Logo & Title)

### Header Container (Line 185)
```jsx
className="text-center pt-8 pb-6 px-8"
```
- `pt-8` - **Top padding** (change to `pt-6`, `pt-10`, `pt-12`, etc.)
- `pb-6` - **Bottom padding** (change to `pb-4`, `pb-8`, etc.)
- `px-8` - **Horizontal padding** (change to `px-6`, `px-10`, etc.)

### Logo Icon Container (Line 191)
```jsx
className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4"
```
- `w-16 h-16` - **Logo size** (change to `w-20 h-20`, `w-12 h-12`, etc.)
- `mb-4` - **Margin below logo** (change to `mb-2`, `mb-6`, etc.)
- `rounded-2xl` - Logo border radius

### Logo Icon (Line 193)
```jsx
<GraduationCap className="w-9 h-9 text-white" />
```
- `w-9 h-9` - **Icon size** (change to `w-8 h-8`, `w-10 h-10`, etc.)

### School Title (Line 195)
```jsx
className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2"
```
- `text-3xl` - **Title font size** (change to `text-2xl`, `text-4xl`, etc.)
- `mb-2` - **Margin below title** (change to `mb-1`, `mb-3`, etc.)

### Subtitle (Line 198)
```jsx
className="text-gray-500 text-sm"
```
- `text-sm` - **Subtitle font size** (change to `text-xs`, `text-base`, etc.)

---

## 🔄 Tab Switcher

### Tab Container (Line 202)
```jsx
<div className="px-8 pb-6">
```
- `px-8` - **Horizontal padding** (change to `px-6`, `px-10`, etc.)
- `pb-6` - **Bottom padding** (change to `pb-4`, `pb-8`, etc.)

### Tab Background (Line 203)
```jsx
<div className="flex bg-gray-100 rounded-xl p-1 relative">
```
- `p-1` - **Internal padding** (change to `p-1.5`, `p-2`, etc.)
- `rounded-xl` - Border radius

### Tab Buttons (Lines 223, 239)
```jsx
className="relative z-10 flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-colors"
```
- `py-3` - **Vertical padding** (change to `py-2`, `py-4`, etc.)
- `px-4` - **Horizontal padding** (change to `px-3`, `px-5`, etc.)
- `text-sm` - **Font size** (change to `text-xs`, `text-base`, etc.)

### Active Tab Indicator (Line 207)
```jsx
className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm"
```
- `top-1 bottom-1` - **Vertical spacing** (change to `top-0.5 bottom-0.5`, etc.)

---

## 📝 Form Container

### Form Wrapper (Line 250)
```jsx
<div className="px-8 pb-8">
```
- `px-8` - **Horizontal padding** (change to `px-6`, `px-10`, etc.)
- `pb-8` - **Bottom padding** (change to `pb-6`, `pb-10`, etc.)

### Form Spacing (Line 259)
```jsx
className="space-y-5"
```
- `space-y-5` - **Vertical spacing between fields** (change to `space-y-4`, `space-y-6`, etc.)

---

## 📋 Input Fields

### Name Fields Grid (Line 265)
```jsx
className="grid grid-cols-2 gap-4"
```
- `gap-4` - **Gap between name fields** (change to `gap-3`, `gap-5`, etc.)

### Label (Lines 268, 288, 312, 337, 370)
```jsx
className="block text-sm font-medium text-gray-700 mb-2"
```
- `text-sm` - **Label font size** (change to `text-xs`, `text-base`, etc.)
- `mb-2` - **Margin below label** (change to `mb-1`, `mb-3`, etc.)

### Input Fields (Lines 276, 296, 322, 347, 380)
```jsx
className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all"
```
- `px-4` - **Horizontal padding** (change to `px-3`, `px-5`, etc.)
- `py-3` - **Vertical padding** (change to `py-2`, `py-4`, etc.)
- `border-2` - **Border width** (change to `border`, `border-[1px]`, etc.)
- `rounded-xl` - **Border radius** (change to `rounded-lg`, `rounded-2xl`, etc.)

### Input with Icons (Email, Password)
```jsx
className="w-full pl-12 pr-4 py-3 ..."
```
- `pl-12` - **Left padding for icon space** (change to `pl-10`, `pl-14`, etc.)
- `pr-4` - **Right padding** (change to `pr-3`, `pr-5`, etc.)
- `pr-12` - **Right padding for password toggle** (change to `pr-10`, `pr-14`, etc.)

### Icon Position (Lines 316, 341, 374)
```jsx
className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
```
- `left-4` - **Icon left position** (change to `left-3`, `left-5`, etc.)
- `w-5 h-5` - **Icon size** (change to `w-4 h-4`, `w-6 h-6`, etc.)

### Password Toggle Button (Lines 357, 390)
```jsx
className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
```
- `right-4` - **Toggle button position** (change to `right-3`, `right-5`, etc.)

---

## ☑️ Checkboxes

### Checkbox Container (Lines 416, 455)
```jsx
className="w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all"
```
- `w-5 h-5` - **Checkbox size** (change to `w-4 h-4`, `w-6 h-6`, etc.)
- `border-2` - **Border width**

### Checkbox Icon (Lines 427, 466)
```jsx
<Check className="w-4 h-4 text-white" />
```
- `w-4 h-4` - **Check icon size** (change to `w-3 h-3`, `w-5 h-5`, etc.)

### Checkbox Label Spacing (Line 407)
```jsx
className="flex items-center space-x-2 cursor-pointer group"
```
- `space-x-2` - **Spacing between checkbox and text** (change to `space-x-1`, `space-x-3`, etc.)

---

## 🔘 Submit Button (Line 491)

```jsx
className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden group"
```
- `w-full` - **Button width** (full width, or change to `w-auto px-8`, etc.)
- `py-4` - **Vertical padding** (change to `py-3`, `py-5`, etc.)
- `rounded-xl` - **Border radius** (change to `rounded-lg`, `rounded-2xl`, etc.)

### Loading Spinner (Line 506)
```jsx
className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
```
- `w-5 h-5` - **Spinner size** (change to `w-4 h-4`, `w-6 h-6`, etc.)
- `mr-2` - **Margin right** (change to `mr-3`, etc.)

---

## 🔗 Link Text (Line 520)

```jsx
className="text-center text-sm text-gray-600"
```
- `text-sm` - **Font size** (change to `text-xs`, `text-base`, etc.)

---

## 🎭 Background Shapes (Lines 141, 155, 169)

```jsx
className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
```
- `w-96 h-96` - **Shape size** (change to `w-80 h-80`, `w-[400px] h-[400px]`, etc.)
- `blur-3xl` - **Blur amount** (change to `blur-2xl`, `blur-[100px]`, etc.)

---

## 📱 Responsive Breakpoints

To make changes responsive, use Tailwind breakpoints:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

Example:
```jsx
className="px-4 md:px-6 lg:px-8"
```

---

## 🎨 Quick Reference: Common Changes

| Component | Property | Current Value | Location |
|-----------|---------|---------------|----------|
| Card Width | `max-w-[460px]` | 460px | Line 178 |
| Card Padding | `px-8` | 32px | Lines 185, 202, 250 |
| Header Padding | `pt-8 pb-6` | 32px top, 24px bottom | Line 185 |
| Logo Size | `w-16 h-16` | 64px | Line 191 |
| Input Padding | `px-4 py-3` | 16px horizontal, 12px vertical | Lines 276, 296, etc. |
| Button Padding | `py-4` | 16px vertical | Line 491 |
| Form Spacing | `space-y-5` | 20px between fields | Line 259 |
| Border Radius | `rounded-xl` | 12px | Multiple locations |

---

## 💡 Tips

1. **Consistent Spacing**: Use Tailwind's spacing scale (4px increments):
   - `p-1` = 4px
   - `p-2` = 8px
   - `p-3` = 12px
   - `p-4` = 16px
   - `p-6` = 24px
   - `p-8` = 32px

2. **Card Width**: Keep between 420-480px for optimal desktop experience

3. **Input Height**: Standard is `py-3` (12px top/bottom = 24px total + text height)

4. **Test Responsively**: Always check mobile, tablet, and desktop views after changes






