import React, { useEffect, useState, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
} from "lexical";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import {
  $isHeadingNode,
  $createHeadingNode,
  $createQuoteNode,
} from "@lexical/rich-text";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
  getCodeLanguages,
} from "@lexical/code";
import {
  $isParentElementRTL,
  $wrapNodes,
  $isAtNodeEnd,
} from "@lexical/selection";
import { eventTypes } from "./toolbarIconsList";
import { InsertImageDialog } from "../CustomPlugins/ImagePlugin";
import useModal from "../../common/hooks/useModal";

const LowPriority = 1;

const useOnClickListener = () => {
  const [editor] = useLexicalComposerContext();
  const [modal, showModal] = useModal();
  const [blockType, setBlockType] = useState("paragraph");
  const [selectedElementKey, setSelectedElementKey] = useState(null);
  const [isRTL, setIsRTL] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    let allSelectedEvents = [...selectedEventTypes];

    const pushInEventTypesState = (selectionFormat, event) => {
      if (selectionFormat) {
        if (selectedEventTypes.includes(event)) return;
        else allSelectedEvents.push(event);
      } else {
        allSelectedEvents = allSelectedEvents.filter((ev) => ev !== event);
      }
    };

    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();

          setBlockType(type);
        }
      }

      pushInEventTypesState(selection.hasFormat("bold"), eventTypes.formatBold);
      pushInEventTypesState(
        selection.hasFormat("italic"),
        eventTypes.formatItalic
      );
      pushInEventTypesState(
        selection.hasFormat("underline"),
        eventTypes.formatUnderline
      );
      pushInEventTypesState(
        selection.hasFormat("strikethrough"),
        eventTypes.formatStrike
      );
      pushInEventTypesState(selection.hasFormat("code"), eventTypes.formatCode);

      setIsRTL($isParentElementRTL(selection));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        if (!allSelectedEvents.includes(eventTypes.formatInsertLink))
          allSelectedEvents.push(eventTypes.formatInsertLink);
        setIsLink(true);
      } else {
        if (allSelectedEvents.includes(eventTypes.formatInsertLink)) {
          allSelectedEvents = allSelectedEvents.filter(
            (ev) => ev !== eventTypes.formatCode
          );
        }
        setIsLink(false);
      }

      setSelectedEventTypes(allSelectedEvents);
    }
  }, [editor, selectedEventTypes]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const onClick = (eventType) => {
    switch (eventType) {
      case eventTypes.formatUndo:
        editor.dispatchCommand(UNDO_COMMAND);
        break;
      case eventTypes.formatRedo:
        editor.dispatchCommand(REDO_COMMAND);
        break;
      case eventTypes.formatBold:
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        break;
      case eventTypes.formatItalic:
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        break;
      case eventTypes.formatStrike:
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        break;
      case eventTypes.formatUnderline:
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        break;
      case eventTypes.formatAlignLeft:
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
        break;
      case eventTypes.formatAlignRight:
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
        break;
      case eventTypes.formatAlignCenter:
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
        break;
      case eventTypes.paragraph:
        formatParagraph();
        break;
      case eventTypes.h1:
        formatLargeHeading();
        break;
      case eventTypes.h2:
        formatSmallHeading();
        break;
      case eventTypes.ul:
        formatBulletList();
        break;
      case eventTypes.ol:
        formatNumberedList();
        break;
      case eventTypes.quote:
        formatQuote();
        break;
      case eventTypes.formatCode:
        formatCode();
        break;
      case eventTypes.formatInsertLink:
        insertLink();
        break;
      case eventTypes.insertImage:
        showModal("Insert Image", (onClose) => (
          <InsertImageDialog activeEditor={editor} onClose={onClose} />
        ));
        break;
      default:
        break;
    }
  };

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  const formatParagraph = () => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatLargeHeading = () => {
    if (blockType !== "h1") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h1"));
        }
      });
    }
  };

  const formatSmallHeading = () => {
    if (blockType !== "h2") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h2"));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== "ul") {
      console.log("dispatch command ");
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== "code") {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
      // below code insert the new block but we only need to format the specific part of the text into code format
      //   editor.update(() => {
      //     const selection = $getSelection();

      //     if ($isRangeSelection(selection)) {
      //       $wrapNodes(selection, () => $createCodeNode());
      //     }
      //   });
    }
  };
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
  };

  return { modal, onClick, selectedEventTypes, blockType, isLink, editor,TextEditor };
};

function getSelectedNode(selection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  
  const isBackward = selection.isBackward();
  
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
  
  
}

export default useOnClickListener;
