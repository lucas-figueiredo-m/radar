import axios from 'axios';
import ActionButton from '../components/ActionButton';
import NetworkItem from '../components/NetworkItem';
import ScreenContainer from '../components/ScreenContainer';
import SectionGroup from '../components/SectionGroup';

const REST_ITEMS = [
  {
    method: 'GET' as const,
    path: '/posts?_limit=3',
    color: '#a855f7',
    onPress: () => {
      fetch('https://jsonplaceholder.typicode.com/posts?_limit=3')
        .then(r => r.json())
        .then(data => console.log('Fetched posts:', data.length))
        .catch(err => console.error('Fetch failed:', err));
    },
  },
  {
    method: 'GET' as const,
    path: '/users/1',
    color: '#a855f7',
    onPress: () => {
      fetch('https://jsonplaceholder.typicode.com/users/1')
        .then(r => r.json())
        .then(data => console.log('Fetched user:', data.name))
        .catch(err => console.error('Fetch failed:', err));
    },
  },
  {
    method: 'POST' as const,
    path: '/posts',
    color: '#10b981',
    onPress: () => {
      fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Post',
          body: 'Hello from Radar',
          userId: 1,
        }),
      })
        .then(r => r.json())
        .then(data => console.log('Created post:', data))
        .catch(err => console.error('Post failed:', err));
    },
  },
  {
    method: 'PUT' as const,
    path: '/posts/1',
    color: '#f59e0b',
    onPress: () => {
      fetch('https://jsonplaceholder.typicode.com/posts/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1,
          title: 'Updated Post',
          body: 'Modified via Radar',
          userId: 1,
        }),
      })
        .then(r => r.json())
        .then(data => console.log('Updated post:', data))
        .catch(err => console.error('Put failed:', err));
    },
  },
  {
    method: 'DELETE' as const,
    path: '/posts/1',
    color: '#ef4444',
    onPress: () => {
      fetch('https://jsonplaceholder.typicode.com/posts/1', {
        method: 'DELETE',
      })
        .then(r => console.log('Deleted, status:', r.status))
        .catch(err => console.error('Delete failed:', err));
    },
  },
];

const ERROR_ITEMS = [
  {
    method: 'GET' as const,
    path: '/500 (server error)',
    color: '#ef4444',
    onPress: () => {
      fetch('https://httpstat.us/500')
        .then(r => console.warn('Got status:', r.status))
        .catch(err => console.error('Request failed:', err));
    },
  },
  {
    method: 'GET' as const,
    path: '/404 (not found)',
    color: '#f97316',
    onPress: () => {
      fetch('https://httpstat.us/404')
        .then(r => console.warn('Got status:', r.status))
        .catch(err => console.error('Request failed:', err));
    },
  },
  {
    method: 'GET' as const,
    path: '/timeout (408)',
    color: '#64748b',
    onPress: () => {
      fetch('https://httpstat.us/408')
        .then(r => console.warn('Got status:', r.status))
        .catch(err => console.error('Request failed:', err));
    },
  },
];

const AXIOS_ITEMS = [
  {
    method: 'GET' as const,
    path: '/posts?_limit=2 (axios)',
    color: '#06b6d4',
    onPress: () => {
      axios
        .get('https://jsonplaceholder.typicode.com/posts?_limit=2')
        .then(res => console.log('Axios GET posts:', res.data.length))
        .catch(err => console.error('Axios GET failed:', err));
    },
  },
  {
    method: 'POST' as const,
    path: '/posts (axios)',
    color: '#14b8a6',
    onPress: () => {
      axios
        .post('https://jsonplaceholder.typicode.com/posts', {
          title: 'Axios Post',
          body: 'Hello from Axios',
          userId: 1,
        })
        .then(res => console.log('Axios POST created:', res.data))
        .catch(err => console.error('Axios POST failed:', err));
    },
  },
];

const BATCH_ITEMS = [
  {
    title: 'Burst 10 requests',
    subtitle: 'Fire 10 GET requests simultaneously',
    color: '#f43f5e',
    onPress: () => {
      for (let i = 1; i <= 10; i++) {
        fetch(`https://jsonplaceholder.typicode.com/posts/${i}`)
          .then(r => r.json())
          .then(data => console.log(`Post #${i}:`, data.title))
          .catch(err => console.error(`Request #${i} failed:`, err));
      }
    },
  },
  {
    title: 'Sequential chain',
    subtitle: 'GET -> POST -> GET in sequence',
    color: '#8b5cf6',
    onPress: async () => {
      try {
        const user = await fetch(
          'https://jsonplaceholder.typicode.com/users/1',
        ).then(r => r.json());
        console.log('Step 1 - Got user:', user.name);

        const post = await fetch(
          'https://jsonplaceholder.typicode.com/posts',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Post by ${user.name}`,
              body: 'Chained request',
              userId: user.id,
            }),
          },
        ).then(r => r.json());
        console.log('Step 2 - Created post:', post.id);

        const comments = await fetch(
          'https://jsonplaceholder.typicode.com/posts/1/comments',
        ).then(r => r.json());
        console.log('Step 3 - Got comments:', comments.length);
      } catch (err) {
        console.error('Chain failed:', err);
      }
    },
  },
];

const NetworkScreen = () => (
  <ScreenContainer
    title="Network"
    subtitle="Test HTTP request interception"
  >
    <SectionGroup title="REST Methods">
      {REST_ITEMS.map(item => (
        <NetworkItem
          key={`${item.method}-${item.path}`}
          method={item.method}
          path={item.path}
          color={item.color}
          onPress={item.onPress}
        />
      ))}
    </SectionGroup>

    <SectionGroup title="Error Responses">
      {ERROR_ITEMS.map(item => (
        <NetworkItem
          key={item.path}
          method={item.method}
          path={item.path}
          color={item.color}
          onPress={item.onPress}
        />
      ))}
    </SectionGroup>

    <SectionGroup title="XHR / Axios">
      {AXIOS_ITEMS.map(item => (
        <NetworkItem
          key={`${item.method}-${item.path}`}
          method={item.method}
          path={item.path}
          color={item.color}
          onPress={item.onPress}
        />
      ))}
    </SectionGroup>

    <SectionGroup title="Stress Test">
      {BATCH_ITEMS.map(item => (
        <ActionButton
          key={item.title}
          title={item.title}
          subtitle={item.subtitle}
          color={item.color}
          onPress={item.onPress}
        />
      ))}
    </SectionGroup>
  </ScreenContainer>
);

export default NetworkScreen;
