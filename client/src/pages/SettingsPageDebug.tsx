// ============================================================================
// DEBUG: Simple SettingsPage for testing credentials storage
// ============================================================================

import { useState, useEffect } from 'react';
import { useAWS } from '../context/AWSContext';

export const SettingsPageDebug = () => {
  const { credentials, setCredentials } = useAWS();
  const [key, setKey] = useState('');
  const [secret, setSecret] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [useGentle, setUseGentle] = useState(false);
  const [endpoint, setEndpoint] = useState('http://localhost:4566');

  // Log credentials on mount and when they change
  useEffect(() => {
    console.log('=== SettingsPageDebug mounted ===');
    console.log('Current credentials from context:', credentials);
    if (credentials) {
      setKey(credentials.accessKeyId);
      setSecret(credentials.secretAccessKey);
      setRegion(credentials.region);
      setUseGentle(credentials.isLocalStack);
    }
  }, [credentials]);

  const handleSave = () => {
    console.log('💾 handleSave called');
    console.log('Saving with:', { key, secret, region, useGentle, endpoint });
    
    if (!key || !secret) {
      alert('❌ Key and Secret required');
      return;
    }

    const creds = {
      accessKeyId: key,
      secretAccessKey: secret,
      region,
      isLocalStack: useGentle,
    };

    console.log('📝 Calling setCredentials with:', creds);
    setCredentials(creds);
    
    console.log('✅ After setCredentials');
    alert('✅ Saved! Check console and SessionStorage');
  };

  const handleTest = async () => {
    console.log('🧪 Testing connection');
    try {
      const resp = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: key,
          secretAccessKey: secret,
          region,
          isLocalStack: useGentle,
          endpoint: useGentle ? endpoint : undefined,
        }),
      });
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Found', data.alerts?.length, 'alerts');
        alert(`✅ Connection OK! Found ${data.alerts?.length || 0} alerts`);
      } else {
        console.error('❌ Response not ok:', resp.status);
        alert(`❌ Error: ${resp.status}`);
      }
    } catch (e) {
      console.error('❌ Fetch error:', e);
      alert('❌ Error: ' + String(e));
    }
  };

  return (
    <div style={{ padding: '20px', color: 'white', background: '#0a0e27' }}>
      <h1>DEBUG: Settings Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Credentials from Context:</h2>
        <pre style={{ background: '#1a1f3a', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(credentials, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Form:</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Access Key ID:</label>
          <input
            value={key}
            onChange={e => setKey(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', background: '#0F1117', color: 'white', border: '1px solid #666' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Secret Access Key:</label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', background: '#0F1117', color: 'white', border: '1px solid #666' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Region:</label>
          <input
            value={region}
            onChange={e => setRegion(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', background: '#0F1117', color: 'white', border: '1px solid #666' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={useGentle}
              onChange={e => setUseGentle(e.target.checked)}
            />
            {' '}Use LocalStack
          </label>
        </div>

        {useGentle && (
          <div style={{ marginBottom: '10px' }}>
            <label>LocalStack Endpoint:</label>
            <input
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px', background: '#0F1117', color: 'white', border: '1px solid #666' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSave} style={{ padding: '10px 20px', background: '#47B2FF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            Save
          </button>
          <button onClick={handleTest} style={{ padding: '10px 20px', background: '#00AA880', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            Test Connection
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Debug Info:</h2>
        <p>1. Fill in the form above</p>
        <p>2. Click Save</p>
        <p>3. Check browser console (F12) for logging</p>
        <p>4. Check Application → SessionStorage → aws_credentials</p>
        <p>5. Click Test Connection to verify</p>
        <p>6. Go to Security page - should work now!</p>
      </div>
    </div>
  );
};
