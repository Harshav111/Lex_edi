import { TextBoxEditOutline } from "mdi-material-ui";

const TextEditor = () => {
    const [content, setContent] = useState('');
  
    // Function to handle inserting text at cursor position
    const insertTextAtCursor = (textToInsert) => {
      const textarea = document.getElementById('textArea'); // Get textarea element by ID
      if (!textarea) return;
  
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
  
      // Insert text at current cursor position
      const text = textarea.value;
      const newText = text.substring(0, startPos) + textToInsert + text.substring(endPos);
      setContent(newText);
  
      // Move cursor to end of inserted text
      textarea.selectionStart = startPos + textToInsert.length;
      textarea.selectionEnd = startPos + textToInsert.length;
    };
  
    // Event handler for button click
    const handleButtonClick = (eventType) => {
      switch (eventType) {
        case eventTypes.emojiObjects:
          insertTextAtCursor('😊'); // Example emoji text to insert
          break;
        // Add cases for other event types as needed
        default:
          break;
      }
    };
  
    return (
      <div>
        <div>
          {pluginsList.map((plugin) => (
            <Tooltip key={plugin.id} title={plugin.event}>
              <IconButton onClick={() => handleButtonClick(plugin.event)}>
                <plugin.Icon />
              </IconButton>
            </Tooltip>
          ))}
        </div>
        <TextareaAutosize
          id="textArea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          cols={50}
          style={{ marginTop: '10px' }}
        />
      </div>
    );
  };
  export default TextEditor;