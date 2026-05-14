import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export default function Notifications({ onClose }) {
  const { user } = useApp()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('notifications')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { setNotes(data || []); setLoading(false) })
  }, [user])

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotes(n => n.map(x => x.id === id ? { ...x, read: true } : x))
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
    setNotes(n => n.map(x => ({ ...x, read: true })))
  }

  const unread = notes.filter(n => !n.read).length

  const typeColor = {
    weekly_plan:     'var(--accent)',
    streak_congrats: 'var(--amber)',
    streak_nudge:    'var(--blue)',
    milestone:       'var(--purple)',
  }
  const typeIcon = {
    weekly_plan:     '📋',
    streak_congrats: '🔥',
    streak_nudge:    '💪',
    milestone:       '🏆',
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.7)',
      zIndex:9000, display:'flex', alignItems:'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg2)', borderRadius:'20px 20px 0 0',
        width:'100%', maxHeight:'80vh', overflow:'hidden',
        display:'flex', flexDirection:'column',
        border:'1px solid var(--border)', borderBottom:'none',
      }}>
        {/* Header */}
        <div style={{ padding:'20px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)' }}>
          <div>
            <div className="syne fw7" style={{ fontSize:18 }}>Notifications</div>
            {unread > 0 && <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{unread} unread</div>}
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                Mark all read
              </button>
            )}
            <button onClick={onClose} style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--muted)', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>Close</button>
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY:'auto', flex:1 }}>
          {loading && (
            <div style={{ textAlign:'center', padding:32, color:'var(--muted)' }}>Loading...</div>
          )}
          {!loading && notes.length === 0 && (
            <div style={{ textAlign:'center', padding:32, color:'var(--muted)' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🔔</div>
              No notifications yet — check back after your first week!
            </div>
          )}
          {notes.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)} style={{
              display:'flex', gap:12, padding:'14px 20px',
              borderBottom:'1px solid var(--border)',
              background: n.read ? 'transparent' : 'rgba(0,200,150,.04)',
              cursor:'pointer',
            }}>
              <div style={{ fontSize:24, flexShrink:0 }}>{typeIcon[n.type] || '📣'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, lineHeight:1.5, color: n.read ? 'var(--muted)' : 'var(--text)' }}>{n.message}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
                  {new Date(n.created_at).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}
                </div>
              </div>
              {!n.read && <div style={{ width:8, height:8, borderRadius:'50%', background:typeColor[n.type]||'var(--accent)', flexShrink:0, marginTop:6 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
