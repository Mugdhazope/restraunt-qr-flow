# Digital Menu — Client Playbook

A guide for restaurant staff on how the dashboard works, how guests use the QR menu, and how to customize the mobile experience with the Layout Editor.

---

## What this system does

Your outlet gets a **mobile digital menu** that guests open by scanning a QR code. You manage everything from the **Dashboard**:

- **Menu** — categories, dishes, prices, photos, badges (New, Popular, Jain, etc.)
- **Appearance** — logo, tagline, colors, background photo, tag chip styles
- **Layout Editor** — arrange what guests see on each screen (Welcome, Checked In, Menu, Item Detail)
- **QR code** — download and print for tables, entrance, receipts
- **Customers** — guest list and visit tracking from check-in

Each **outlet** (location) has its own menu, QR link, and layout. Use the outlet switcher in the left sidebar to change which location you are editing.

---

## How guests use the QR menu

Typical flow when someone scans your QR:

```
Scan QR → Welcome (optional check-in) → Checked In → Menu → Item Detail
```

| Step | What the guest sees |
|------|---------------------|
| **1. Scan QR** | Opens your menu in the phone browser |
| **2. Welcome** | Restaurant name, logo, optional name/phone form, Continue button |
| **3. Checked In** | Confirmation, loyalty progress, “View Menu” |
| **4. Menu** | Magazine-style pages with categories and dishes |
| **5. Item Detail** | Full dish view — photo, description, price, tags |

Guests can also go **straight to the menu** depending on how your entry URL is shared. The screens above are what you customize in the Layout Editor.

**Important:** Changes to menu content (dishes/prices) show up as soon as you save in **Menu**. Changes to look & layout require saving in **Layout Editor** or **Settings → Appearance**.

---

## Dashboard overview

After login, the sidebar includes:

| Section | Purpose |
|---------|---------|
| **Dashboard** | Summary stats for the selected outlet |
| **Customers** | Guest list, visit history, tags, notes |
| **Import Customers** | Bulk upload customer records |
| **Menu** | Add/edit categories, items, images, prices, badges |
| **Layout Editor** | Visual editor for all QR screens |
| **QR & Entry Flow** | Your QR code, scan URL, download PNG |
| **Analytics** | Charts and trends |
| **Settings** | Outlet info and **Appearance** |

Use the **outlet name** at the top of the sidebar to switch locations if you manage more than one.

---

## Menu management

**Path:** Dashboard → **Menu**

### Categories
- Create categories (e.g. Starters, Mains, Desserts)
- Collapse/expand categories in the list
- Delete empty categories when needed

### Items
For each dish you can set:
- **Name** and **description**
- **Price**
- **Category**
- **Photo** (upload or bulk upload with manifest)
- **Image scale** — zoom/crop how the photo appears on the menu (50–200%)
- **Tags** — Bestseller, Chef's Pick, Popular, New
- **Featured** / **New** / **Jain** toggles

### Tips for dish photos
- **Remove the background first.** Dish images look much cleaner on the menu when the plate/food sits on a transparent (or plain) background. Use any free online background remover (search “remove image background”), download the result as PNG, then upload that file in **Menu**.
- Good lighting and a clear crop make the magazine layout look best
- Use **New** and **Featured** sparingly so badges stay meaningful
- After editing, open **QR & Entry Flow → Open live menu** to preview on your phone

---

## Branding & appearance (outlet-wide)

These settings apply to **every QR page** for the selected outlet.

**Path (either):**
- Dashboard → **Settings** → **Appearance**
- Dashboard → **Layout Editor** → **Outlet appearance** (left panel)

Click **Save outlet appearance** when done.

### Behind the page (global background)
This is the **photo or color behind all pages** — like wallpaper behind the menu.

| Type | Use when |
|------|----------|
| **Solid color** | Simple branded backdrop |
| **Gradient** | Soft color blend |
| **Background image** | Restaurant photo, texture, brand image |

For images you can adjust:
- Size (cover / contain), position, repeat
- Image opacity, blur, brightness
- Optional **overlay color** + opacity (darken/lighten the photo)

### Restaurant logo
- Upload **one logo per outlet**
- Used anywhere you place a **Restaurant Logo** block in the Layout Editor
- Same logo on Welcome, Checked In, etc.

### Tagline
- Short line under the restaurant name (e.g. “Wood-fired goodness, served with love.”)
- **Edit here** in Appearance
- **Show or hide per page** in Layout Editor → Restaurant Name → “Show tagline”

Leave tagline blank if you do not want one anywhere.

### Font colors
- **Text** — main body text
- **Secondary** — muted/helper text
- **Primary / accent** — buttons, highlights
- **Page title on bg** — large faded category words on menu pages (e.g. “Desserts”)

### Tag styles
Customize chip colors and emoji for:
New, Featured, Popular, Bestseller, Chef's pick, Jain.

Clear emoji field for text-only chips.

---

## Layout Editor — full guide

**Path:** Dashboard → **Layout Editor**

The editor shows a **phone preview** in the center. What you see there is what guests get on that page (after you **Save**).

### The four pages

| Page | What it controls |
|------|------------------|
| **Welcome** | First screen after scan — logo, name, check-in form, Continue |
| **Checked In** | After successful check-in — loyalty, View Menu |
| **Menu** | Full menu book experience |
| **Item Detail** | Single dish screen (can customize per dish) |

Each page saves **separately**. A dot on the page tab means unsaved changes.

### Editor layout (desktop)

```
┌─────────────┬──────────────────┬─────────────┐
│  Pages      │   Phone preview  │  Inspector  │
│  Layers     │                  │  (settings  │
│  Components │                  │   for sel.) │
└─────────────┴──────────────────┴─────────────┘
```

### Editor layout (mobile)
- **Page chips** at the top switch Welcome / Checked In / Menu / Item Detail
- **Layers** and **Inspector** open as slide-over panels
- **Save** bar at the bottom when you have unsaved changes

### Key actions

| Button | What it does |
|--------|----------------|
| **Save** | Publishes the **current page** to live QR |
| **Save [Page name]** (in sidebar) | Saves that specific page only |
| **Discard** | Reverts current page to last saved version |
| **Reset** | Restores factory default layout for that page |

Always **Save** after moving blocks or changing colors. Unsaved work is lost if you leave the page or discard.

---

## Backgrounds: two layers (important)

QR screens use **two stacked layers**. Think of it like a desk:

```
┌──────────────────────────────┐
│  Page background             │  ← surface where items live
│  (solid / gradient / none)   │
├──────────────────────────────┤
│  Outlet appearance           │  ← photo/color behind the page
│  (Settings / Outlet appearance) │
└──────────────────────────────┘
```

### Outlet appearance (“behind the page”)
- Set in **Settings → Appearance** or **Layout Editor → Outlet appearance**
- Usually your **restaurant photo** or brand color
- Same on all pages unless the page surface covers it

### Page background (“where items live”)
- Set by selecting **Page background** in the layers list (or the Page root)
- Options:
  - **None — see outlet behind** — transparent; outlet photo shows through
  - **Solid** — flat color with adjustable opacity
  - **Gradient** — two colors with adjustable opacity

**Example:** Outlet photo behind + semi-transparent white page fill = readable menu on top of your ambiance photo.

---

## Working with components

### Adding components
1. Open the correct **page** (Welcome, Menu, etc.)
2. In the left panel, **Add component**
3. Click the block type you want
4. Drag to position on the phone preview
5. Select it and edit in the **Inspector**
6. **Save** the page

### Common components

| Component | Typical use |
|-----------|-------------|
| **Restaurant Logo** | Brand mark (uses outlet logo from Appearance) |
| **Restaurant Name** | Title + optional tagline |
| **Text** | Headings, instructions, muted copy |
| **Check-In Form** | Name + phone on Welcome |
| **CTA Button** | Continue, View Menu, etc. |
| **Loyalty Summary** | Visit progress on Checked In |
| **Menu Book** | Full menu (Menu page — usually one block) |
| **Item Detail Shell** | Full item view (Item Detail page) |
| **Banner / Divider** | Visual separation |

### Moving & resizing
- Click a block on the preview to select it
- **Drag** to move (unlocked blocks)
- **Corner handles** to resize
- **Menu Book** and **Item Detail Shell** use a top “Drag block” bar — dish labels inside can be edited separately

### Layers panel
- Lists all blocks on the page top-to-bottom
- Click to select
- **Outlet appearance** — global branding (not a layer on canvas)
- **Page background** — page surface settings
- **Paste** — paste a copied component from another page

### Restaurant Name settings
- **Display text** — override name (leave blank to use outlet name)
- **Show tagline** — on/off for **this page only**
- Tagline **text** is edited in **Settings → Appearance**, not here

### Restaurant Logo settings
- Logo **image** comes from **Outlet appearance**
- Here you set **size**, **align**, **fit**, **corner radius** for this placement

---

## Item Detail — per-dish customization

On the **Item Detail** page:
1. Use the **Editing item** dropdown to pick a dish
2. Adjust layout for that item (label positions, styles)
3. **Save Item Detail** — saves layout for that dish

Other dishes keep their own overrides. Use this when one hero dish needs a different label layout.

---

## Menu page — dish labels

The **Menu Book** block controls the magazine layout. In the editor you can:
- Select **item name**, **price**, **tags**, or **tap hint** labels
- Change font, color, size, position per label
- Drag **dish slots** on the page (editor mode)

Category **filter** in the editor header helps preview one category at a time.

---

## QR & Entry Flow

**Path:** Dashboard → **QR & Entry Flow**

- **Scan URL** — link encoded in the QR (share this for testing)
- **Download PNG** — print-ready QR image
- **Open live menu** — preview exactly what guests see

Place QR codes at tables, entrance, or on receipts. After changing menu or layout, scan again to verify.

---

## Settings (other tabs)

### Outlets
View outlet name and location. Multi-outlet accounts switch via the sidebar.

---

## Customers & analytics

### Customers
- Search and filter guest list
- See visit count, tags (e.g. First Timer), phone
- Add notes from visits / check-ins

### Analytics
- Customer growth and outlet trends

---

## Recommended workflows

### Launch a new outlet
1. **Settings → Outlets** — confirm outlet details  
2. **Menu** — add categories, items, photos (remove backgrounds on dish images first)  
3. **Settings → Appearance** — logo, tagline, background, colors  
4. **Layout Editor** — tweak Welcome / Menu if needed, **Save** each page  
5. **QR & Entry Flow** — download QR, test scan on your phone  

### Refresh seasonal menu
1. Prep new photos with background removed, then update items in **Menu**  
2. Mark new dishes with **New** tag  
3. Optional: adjust **Appearance** tag colors  
4. Preview via **Open live menu**  

### New brand photo behind the menu
1. **Settings → Appearance** → upload **Background image**  
2. Set each page **Page background** to **None** or a light semi-transparent solid  
3. **Save outlet appearance** + **Save** each layout page  

### Hide tagline on Welcome only
1. **Settings → Appearance** — set tagline text  
2. **Layout Editor → Welcome** — select **Restaurant Name**  
3. Uncheck **Show tagline**  
4. **Save Welcome**  

---

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| QR menu looks old | Hard-refresh browser; confirm you **Saved** layout/appearance |
| Logo missing | Upload in **Appearance**, add **Restaurant Logo** block, Save page |
| Background photo not visible | Page background may be opaque — set to **None** or lower opacity |
| Check-in button does nothing | Welcome page needs **CTA Button** with action **submit check_in** |
| Menu empty | Add items in **Menu**; confirm correct **outlet** selected |
| Layout broken on phone | Use **Reset** for that page, then rebuild; or **Discard** unsaved changes |
| Tagline wrong place | Edit text in **Appearance**; show/hide per page on **Restaurant Name** |

---

## Quick reference — where to change what

| I want to change… | Go to… |
|-------------------|--------|
| Dish name, price, photo | **Menu** |
| QR code file | **QR & Entry Flow** |
| Logo (all pages) | **Settings → Appearance** |
| Tagline text | **Settings → Appearance** |
| Show/hide tagline on one page | **Layout Editor → Restaurant Name** |
| Background photo (behind everything) | **Settings → Appearance** |
| Page color overlay | **Layout Editor → Page background** |
| Welcome / check-in layout | **Layout Editor → Welcome** |
| Menu page layout | **Layout Editor → Menu** |
| Single dish detail layout | **Layout Editor → Item Detail** |
| Tag badge colors | **Settings → Appearance → Tag styles** |

---

## Billing & monthly charges

Your monthly fee keeps the digital menu live. It covers:

- **Maintenance** of the web app
- **Bug fixes** and ongoing improvements
- **Support** when you need help
- **Server / hosting charges** (the infrastructure your menu runs on)

### Payment due date
Payment is due **before the 10th of every month**. An **invoice will be shared** each cycle — please settle it on time.

### What happens if payment is late
The menu, dashboard, and QR links all run on paid servers. Those server costs must be paid on the same schedule. If the monthly fee is not received in time, **the web app will go down** (including the guest QR menu) until the outstanding amount is paid. This is automatic once server billing lapses — everything is connected, so unpaid hosting takes the site offline.

Please treat the 10th as a hard deadline so guests can keep scanning and ordering without interruption.

---

## Need help?

- Test always on a **real phone** after saving — the Layout Editor preview matches live QR.
- Save **Appearance** and each **Layout page** separately; they do not auto-save together.
- When in doubt: **Discard** experimental changes, or **Reset** a page to defaults and start again.

For technical issues, support, or billing/invoices, contact your platform administrator.
