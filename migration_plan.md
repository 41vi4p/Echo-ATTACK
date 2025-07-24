### **1. Current System Analysis**

Based on the file structure, here's how your current system works:

*   **Data Ingestion:** The `get_mitre_data/` directory contains Python scripts (`main.py`, `groups.py`, etc.) to fetch data, process it, and save it as individual JSON files in the `output/` directory.
*   **Data Caching:** `mitre_cache.py` reads those JSON files and populates a local SQLite database (`data/mitre_cache/mitre_cache.db`). This acts as a fast, local data source for the dashboard.
*   **Frontend/Backend (Monolith):** `streamlit_dashboard.py` is the core of your application. It uses the Streamlit library to serve a web dashboard. It queries the SQLite database (using functions from `mitre_cache.py`) and renders the UI in the browser, all from a single Python script.
*   **Execution:** The `run_dashboard.sh` script simply starts the Streamlit application.

### **2. Proposed Architecture with Next.js/Node.js**

To migrate this, we will decouple the frontend and backend into two separate components:

*   **Backend (Node.js API):**
    *   A simple Node.js server (using a framework like Express.js) will be responsible for one thing: providing data.
    *   It will connect to the *existing* SQLite database (`mitre_cache.db`). You won't need to change your data ingestion pipeline.
    *   It will expose REST API endpoints (e.g., `/api/groups`, `/api/techniques`, `/api/software`).
    *   This replaces the data-querying logic currently inside `streamlit_dashboard.py` and `mitre_cache.py`.

*   **Frontend (Next.js & Tailwind CSS):**
    *   A Next.js application will handle all the user interface and presentation.
    *   It will be styled with Tailwind CSS for a modern, utility-first design.
    *   It will call the Node.js API to fetch data (groups, techniques, etc.).
    *   It will use React components to build the interactive elements of your dashboard (filters, tables, charts). You can use libraries like `Recharts` or `Chart.js` for data visualization.

This separation makes the application more scalable, maintainable, and modern.

### **3. Step-by-Step Migration Plan**

Here is a high-level plan to perform the migration:

**Step 1: Create the Node.js Backend API**

1.  **Initialize a Node.js project:** Create a new directory, e.g., `api`, and run `npm init -y`.
2.  **Install dependencies:** `npm install express sqlite3 cors`.
3.  **Create the server:** Write a simple `index.js` file to set up an Express server.
4.  **Connect to SQLite:** Use the `sqlite3` package to connect to your existing `/data/mitre_cache/mitre_cache.db` file.
5.  **Build API Endpoints:** Create routes that replicate the data-fetching functions from `mitre_cache.py`. For example:
    *   `GET /api/groups` -> returns all groups.
    *   `GET /api/groups/:id` -> returns a specific group.
    *   `GET /api/techniques` -> returns all techniques.

**Step 2: Set Up the Next.js Frontend**

1.  **Create a new Next.js app:** In your project root, run `npx create-next-app@latest my-dashboard --typescript --tailwind --eslint`.
2.  **Structure your project:** Create `components/` for reusable UI elements (like charts, tables, navigation).
3.  **Fetch data:** In your Next.js pages (e.g., `app/page.tsx`), use `fetch` to call your new Node.js API endpoints. Next.js 13+ makes this easy with Server Components.
4.  **Build the UI:**
    *   Recreate the layout from your Streamlit app using React components and style it with Tailwind CSS.
    *   Use a library like `shadcn/ui` or `Headless UI` to build accessible and stylish components like dropdowns and modals.
    *   Use a charting library like `Recharts` to visualize the data.

**Step 3: Run Both Services**

You will run two services concurrently during development:
*   The Node.js API: `node api/index.js`
*   The Next.js frontend: `npm run dev` (from the `my-dashboard` directory)

Your data pipeline in `get_mitre_data/` can remain exactly as it is. You would run it whenever you need to refresh the data in your SQLite database.
