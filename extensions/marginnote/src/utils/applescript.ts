import { getPreferenceValues, getSelectedText } from "@raycast/api"
import { runAppleScript } from "run-applescript"
import { escape } from "."
import type { NewNote, Preferences } from "../typings"

export async function isRunning(appName: string) {
  try {
    const script = `
    tell application "System Events"
      return (name of processes contains "${appName}")
    end tell
  `
    return (await runAppleScript(script)) === "true"
  } catch (err) {
    console.log(err)
    return false
  }
}

export async function openNotebook(id: string) {
  const { skipAlert, waitingTime } = getPreferenceValues<Preferences>()
  const script = `
    on openMN()
      tell application "MarginNote 3" to activate
      if ${skipAlert} then
        delay ${waitingTime}
        tell application "System Events"
          tell process "MarginNote 3"
            key code 36
          end tell
        end tell
      end if
    end openMN

    on openNotebook()
      open location "marginnote3app://notebook/${id}"
    end openNotebook

    on isRunning(appName)
      tell application "System Events"
        return (name of processes contains appName)
      end tell
    end isRunning

    on isActive(appName)
      tell application "System Events"
        return (name of first process whose frontmost is true) contains appName
      end tell
    end isActive

    if isRunning("MarginNote 3") and not isActive("MarginNote 3") then
    	tell application "MarginNote 3" to activate
      openNotebook()
    else if isRunning("MarginNote 3") then
      openNotebook()
    else
      openMN()
    end if
    `
  runAppleScript(script)
}

export async function restartMN() {
  const { skipAlert, waitingTime } = getPreferenceValues<Preferences>()
  const script = `
    on openMN()
      tell application "MarginNote 3" to activate
      if ${skipAlert} then
        delay ${waitingTime}
        tell application "System Events"
          tell process "MarginNote 3"
            key code 36
          end tell
        end tell
      end if
    end openMN

    on isRunning(appName)
      tell application "System Events"
        return (name of processes contains appName)
      end tell
    end isRunning

    on isActive(appName)
      tell application "System Events"
        return (name of first process whose frontmost is true) contains appName
      end tell
    end isActive

    if isRunning("MarginNote 3") then
      tell application "MarginNote 3" to activate
      repeat until isActive("MarginNote 3")
        delay 0.1
      end repeat
      tell application "MarginNote 3" to quit
      repeat while isRunning("MarginNote 3")
        delay 0.1
      end repeat
      openMN()
    else
      openMN()
    end if
    `
  await runAppleScript(script)
}

export async function openMN() {
  const { skipAlert, waitingTime } = getPreferenceValues<Preferences>()
  const script = `
    tell application "MarginNote 3" to activate
    if ${skipAlert} then
      delay ${waitingTime}
      tell application "System Events"
        tell process "MarginNote 3"
          key code 36
        end tell
      end tell
    end if
    `
  await runAppleScript(script)
}

export async function creatNote(note: NewNote, parentNoteid: string) {
  let { title, excerptText, commentText, tags, link } = note
  title = escape(title)
  excerptText = escape(excerptText)
  commentText = escape(commentText)
  link = escape(link)
  tags = escape(tags)
  return await runAppleScript(`
    tell application "MarginNote 3"
      set n to (fetch note "${parentNoteid}")
      if n is not missing value then
        set cn to child notes of n
        set lastNote to the last item of cn
        set nb to notebook of n
        set nbid to id of nb
        set nn to new note in notebook nbid
        add child notes {nn} target note n
        set color index of nn to ${note.color}
        set title of nn to "${escape(title)}"
        if "${excerptText}" is not "" then
          set excerpt text of nn to "${escape(excerptText)}"
        end if
        if "${commentText}" is not "" then
          append text comment "${escape(commentText)}" target note nn
        end if
        if "${link}" is not "" then
          append text comment "${escape(link)}" target note nn
        end if
        if "${tags}" is not "" then
          append text comment "${escape(tags)}" target note nn
        end if
        get id of lastNote
      end if
    end tell
  `)
}

export async function getSelectedTextLink() {
  const script = `
on getCurrentApp()
	tell application "System Events"
		return (name of first process whose frontmost is true)
	end tell
end getCurrentApp

set CurrentApp to getCurrentApp()

if CurrentApp is "Google Chrome" then
  tell app "Google Chrome" to get the url of the active tab of window 1
else if CurrentApp is "Microsoft Edge" then
  tell app "Microsoft Edge" to get the url of the active tab of window 1
else if CurrentApp is "Arc" then
  tell app "Arc" to get the url of the active tab of window 1
else if CurrentApp is "Safari" then
  tell app "Safari" to get the url of the current tab of window 1
end if
`
  try {
    return {
      text: await getSelectedText(),
      link: (await runAppleScript(script)) ?? ""
    }
  } catch (e) {
    return {
      text: "",
      link: ""
    }
  }
}
