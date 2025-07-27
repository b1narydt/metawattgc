import React, { useEffect, useState } from 'react'
import { createTaskToken, loadTasks, redeemTask } from './ToDoManager'
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material'
import Footer from './Utils/footer'

export default function App() {
  const [tasks, setTasks] = useState<Array<{
    task: string,
    sats: number,
    token: { txid: string, outputIndex: number, lockingScript: any }
  }>>([])

  const [newTask, setNewTask] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const fetchTasks = async () => {
    setLoading(true)
    setStatus('Loading tasks...')
    try {
      const result = await loadTasks()
      setTasks(result)
      setStatus('')
    } catch (err: any) {
      console.error(err)
      setStatus('Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    // 1. Verify that newTask is not empty and meets length requirements
    const trimmedTask = newTask.trim()
    if (!trimmedTask) {
      setStatus('Task cannot be empty')
      return
    }
    
    if (trimmedTask.length < 3) {
      setStatus('Task must be at least 3 characters long')
      return
    }
    
    setCreating(true)
    setStatus('Creating task...')
    
    try {
      // 2. Call createTaskToken with newTask and 1 satoshi
      await createTaskToken(trimmedTask, 1)
      
      // 3. On success, clear input and refresh tasks
      setNewTask('')
      setStatus('Task created!')
      await fetchTasks()
    } catch (err: any) {
      // 4. Handle errors with user-friendly messages
      console.error('Task creation failed:', err)
      const errorMessage = err.message || 'Unknown error occurred'
      setStatus(`Failed to create task: ${errorMessage}. Check Metanet client connectivity.`)
    } finally {
      // 5. Reset creating state
      setCreating(false)
    }
  }

  const handleRedeem = async (idx: number) => {
    const t = tasks[idx]
    setStatus(`Redeeming: "${t.task}"`)
    try {
      await redeemTask({
        txid: t.token.txid,
        outputIndex: t.token.outputIndex,
        lockingScript: t.token.lockingScript,
        amount: t.sats
      })
      setStatus(`Task "${t.task}" completed.`)
      await fetchTasks()
    } catch (err: any) {
      console.error(err)
      setStatus('Redemption failed.')
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return (
    <>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Lab L-7: ToDo List
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, my: 3 }}>
          <TextField
            fullWidth
            label="New Task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Add Task'}
          </Button>
        </Box>

        {status && (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {status}
          </Typography>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : tasks.length === 0 ? (
          <Typography>No tasks found. Add one!</Typography>
        ) : (
          <Box
            sx={{
              maxWidth: '900px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              bgcolor: 'grey.900',
              color: 'white',
              borderRadius: 2,
              p: 2,
              mt: 2
            }}
          >
            <List>
              {tasks.map((t, idx) => (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <Button variant="outlined" onClick={() => handleRedeem(idx)}>
                      Complete
                    </Button>
                  }
                >
                  <ListItemText primary={t.task} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Container>
      <Footer />
    </>
  )
}