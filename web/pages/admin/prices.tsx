import { useEffect, useState } from 'react';
import {
  useGetV1AdminPricesQuery,
  usePostV1AdminPricesMutation,
  useDeleteV1AdminPricesByIdMutation,
  useGetV1AdminUsersQuery,
  useGetV1AdminAlbumsQuery,
  useGetV1ThemesQuery,
  usePostV1ThemesMutation,
  api,
} from '../../src/services/genApi';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'prices' | 'users' | 'albums' | 'themes' | 'jobs'>(
    'prices',
  );

  const tabs = [
    { id: 'prices' as const, label: 'Prices', icon: '💰' },
    { id: 'users' as const, label: 'Users', icon: '👥' },
    { id: 'albums' as const, label: 'Albums', icon: '📸' },
    { id: 'themes' as const, label: 'Themes', icon: '🎨' },
    { id: 'jobs' as const, label: 'Jobs', icon: '🧵' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'prices' && <PricesTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'albums' && <AlbumsTab />}
      {activeTab === 'themes' && <ThemesTab />}
      {activeTab === 'jobs' && <JobsTab />}
    </div>
  );
}

function PricesTab() {
  const { data: prices, isLoading, error, refetch } = useGetV1AdminPricesQuery(undefined as any);
  const [createPrice] = usePostV1AdminPricesMutation();
  const [deletePrice] = useDeleteV1AdminPricesByIdMutation();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    stripe_price_id: '',
    credits: 1,
    active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createPrice({ createPriceRequest: formData }).unwrap();
      // Reset form
      setFormData({
        name: '',
        stripe_price_id: '',
        credits: 1,
        active: true,
      });
      setShowForm(false);
      refetch();
    } catch (err: any) {
      alert(`Error creating price: ${err.data?.message || err.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (priceId: string, priceName: string) => {
    if (confirm(`Are you sure you want to delete "${priceName}"?`)) {
      try {
        await deletePrice({ id: priceId }).unwrap();
        refetch();
      } catch (err: any) {
        alert(`Error deleting price: ${err.data?.message || err.message || 'Unknown error'}`);
      }
    }
  };

  if (isLoading) {
    return <div>Loading prices...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">Error loading prices. Please check your admin permissions.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Price Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Price'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h3 className="mb-4 text-xl font-semibold">Add New Price</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="e.g., Basic Package"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Stripe Price ID</label>
              <input
                type="text"
                value={formData.stripe_price_id}
                onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="price_1ABC123..."
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Credits</label>
              <input
                type="number"
                value={formData.credits}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    credits: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                min="1"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Active
              </label>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Create Price
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-6">
          <h3 className="mb-4 text-xl font-semibold">Existing Prices</h3>

          {!prices || prices.length === 0 ? (
            <p className="text-neutral-600">No prices configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Stripe Price ID</th>
                    <th className="py-2 text-left">Credits</th>
                    <th className="py-2 text-left">Active</th>
                    <th className="py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((price) => (
                    <tr key={price.id} className="border-b">
                      <td className="py-2">{price.name}</td>
                      <td className="py-2 font-mono text-sm">{price.stripe_price_id}</td>
                      <td className="py-2">{price.credits}</td>
                      <td className="py-2">
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            price.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {price.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => handleDelete(price.id || '', price.name || '')}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemesTab() {
  const { data: themes, isLoading, error, refetch } = useGetV1ThemesQuery(undefined);
  const [createTheme] = usePostV1ThemesMutation();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTheme({
        createThemeRequest: {
          name: formData.name,
          prompt: formData.prompt,
        },
      }).unwrap();
      setFormData({ name: '', prompt: '' });
      setShowForm(false);
      refetch();
    } catch (err: any) {
      alert(`Error creating theme: ${err?.data?.message || err?.message || 'Unknown error'}`);
    }
  };

  if (isLoading) return <div>Loading themes...</div>;
  if (error) return <div className="text-red-600">Error loading themes.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Default Themes</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Theme'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h3 className="mb-4 text-xl font-semibold">Add New Theme</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="e.g., Warm Analog"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Prompt</label>
              <input
                type="text"
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Describe the style..."
              />
            </div>

            {/* CSS tokens removed */}

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Create Theme
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-6">
          <h3 className="mb-4 text-xl font-semibold">Existing Themes</h3>
          {!themes || themes.length === 0 ? (
            <p className="text-neutral-600">No themes configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Slug</th>
                    <th className="py-2 text-left">Prompt</th>
                  </tr>
                </thead>
                <tbody>
                  {themes.map((t) => (
                    <tr key={t.id} className="border-b">
                      <td className="py-2">{t.name}</td>
                      <td className="py-2 font-mono text-sm">{t.slug}</td>
                      <td className="py-2 text-sm text-neutral-700">{t.prompt || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading, error } = useGetV1AdminUsersQuery(undefined as any);

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">Error loading users. Please check your admin permissions.</div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">User Management</h2>

      <div className="card">
        <div className="p-6">
          <h3 className="mb-4 text-xl font-semibold">All Users</h3>

          {!users || users.length === 0 ? (
            <p className="text-neutral-600">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Email</th>
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Email</th>
                    <th className="py-2 text-left">Plan</th>
                    <th className="py-2 text-left">Credits</th>
                    <th className="py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-2">{user.email}</td>
                      <td className="py-2">{user.name || '-'}</td>
                      <td className="py-2 font-mono text-sm">{user.email}</td>
                      <td className="py-2">
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            user.plan === 'pro'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.plan}
                        </span>
                      </td>
                      <td className="py-2">{user.credits}</td>
                      <td className="py-2 text-sm text-gray-600">{user.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlbumsTab() {
  const { data: albums, isLoading, error } = useGetV1AdminAlbumsQuery(undefined as any);

  if (isLoading) {
    return <div>Loading albums...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">Error loading albums. Please check your admin permissions.</div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Album Management</h2>

      <div className="card">
        <div className="p-6">
          <h3 className="mb-4 text-xl font-semibold">All Albums</h3>

          {!albums || albums.length === 0 ? (
            <p className="text-neutral-600">No albums found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Slug</th>
                    <th className="py-2 text-left">Owner</th>
                    <th className="py-2 text-left">Visibility</th>
                    <th className="py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {albums.map((album) => (
                    <tr key={album.id} className="border-b">
                      <td className="py-2">{album.name}</td>
                      <td className="py-2 font-mono text-sm">{album.slug}</td>
                      <td className="py-2">{album.owner_email || '-'}</td>
                      <td className="py-2">
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            album.visibility === 'public'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {album.visibility}
                        </span>
                      </td>
                      <td className="py-2 text-sm text-gray-600">{album.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobsTab() {
  const [triggerJobs] = api.useLazyGetV1AdminJobsQuery();
  const [triggerSummary] = api.useLazyGetV1AdminJobsSummaryQuery();
  const [triggerLogs] = api.useLazyGetV1AdminJobsByIdLogsQuery();
  const [items, setItems] = useState<any[] | null>(null);
  type JobsSummary = {
    queued: number;
    running: number;
    succeeded: number;
    failed: number;
  };
  const [summary, setSummary] = useState<JobsSummary | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<string | null>(null);

  async function load() {
    const [jobs, sum] = await Promise.all([
      triggerJobs(undefined as any).unwrap(),
      triggerSummary(undefined as any).unwrap(),
    ]);
    setItems(jobs || []);
    setSummary(sum as unknown as JobsSummary);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Jobs</h2>
      <div className="card p-4">
        <div className="flex gap-4 text-sm">
          <div>
            <span className="font-medium">Queued:</span> {summary?.queued ?? 0}
          </div>
          <div>
            <span className="font-medium">Running:</span> {summary?.running ?? 0}
          </div>
          <div>
            <span className="font-medium">Succeeded:</span> {summary?.succeeded ?? 0}
          </div>
          <div>
            <span className="font-medium">Failed:</span> {summary?.failed ?? 0}
          </div>
          <button className="btn btn-neutral ml-auto h-8" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="p-6">
          <h3 className="mb-4 text-xl font-semibold">Recent Jobs</h3>
          {!items || items.length === 0 ? (
            <p className="text-neutral-600">No jobs found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">ID</th>
                      <th className="py-2 text-left">Type</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Error</th>
                      <th className="py-2 text-left">Enqueued</th>
                      <th className="py-2 text-left">Started</th>
                      <th className="py-2 text-left">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((j) => (
                      <tr key={j.id} className="border-b text-sm">
                        <td className="py-2 font-mono text-xs">
                          <button
                            onClick={async () => {
                              try {
                                const data = await triggerLogs({
                                  id: j.id,
                                  accept: 'application/json',
                                }).unwrap();
                                setSelectedLogs((data as any)?.logs || '');
                              } catch {}
                            }}
                            className="underline decoration-neutral-300 underline-offset-4 hover:text-black"
                          >
                            {j.id}
                          </button>
                        </td>
                        <td className="py-2">{j.type}</td>
                        <td className="py-2">
                          <span
                            className={`rounded px-2 py-1 text-xs ${
                              j.status === 'queued'
                                ? 'bg-yellow-100 text-yellow-800'
                                : j.status === 'running'
                                  ? 'bg-blue-100 text-blue-800'
                                  : j.status === 'succeeded'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {j.status}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate py-2 text-red-600">
                          {j.error || '-'}
                        </td>
                        <td className="py-2">{j.enqueued_at}</td>
                        <td className="py-2">{j.started_at || '-'}</td>
                        <td className="py-2">{j.completed_at || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedLogs !== null && (
                <div className="mt-6 rounded border bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">Job Logs</div>
                    <button className="btn btn-neutral h-8" onClick={() => setSelectedLogs(null)}>
                      Close
                    </button>
                  </div>
                  <pre className="max-h-80 overflow-auto text-xs leading-5 whitespace-pre-wrap">
                    {selectedLogs || '(no logs)'}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
