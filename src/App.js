import React, { Component } from 'react';
import Markdown from 'markdown-to-jsx';
import AceEditor from 'react-ace';
import styled from 'styled-components';
import dateFns from 'date-fns';
import brace from 'brace';
import 'brace/mode/markdown';
import 'brace/theme/dracula';
import './App.css';

const { ipcRenderer } = window.require('electron');
const settings = window.require('electron-settings');
const fs = window.require('fs');

class App extends Component {
  state = {
    loadedFile: '',
    dir: settings.get('dir') || null,
    filesData: [],
    activeIndex: 0,
    newEntry: false,
    newEntryName: '',
  };

  constructor() {
    super();

    //On Load
    const dir = settings.get('dir');
    if (dir) {
      this.loadAndReadFiles(dir);
    }

    ipcRenderer.on('save-file', event => {
      this.saveFile();
    });

    ipcRenderer.on('new-dir', (event, dir) => {
      this.setState({
        dir: dir,
      });
      settings.set('dir', dir);
      this.loadAndReadFiles(dir);
    });
  }

  loadAndReadFiles = dir => {
    fs.readdir(dir, (err, files) => {
      const filteredFiles = files.filter(file => file.includes('.md'));
      const filesData = filteredFiles.map(file => {
        const date = file.substr(
          file.indexOf('_') + 1,
          file.indexOf('.') - file.indexOf('_') - 1
        );
        return {
          date,
          path: `${dir}/${file}`,
          title: file.substr(0, file.indexOf('_')),
        };
      });

      filesData.sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        const aSec = aDate.getTime();
        const bSec = bDate.getTime();
        return bSec - aSec;
      });

      this.setState(
        {
          filesData,
        },
        () => this.loadFile(0)
      );
    });
  };

  loadFile = index => {
    const { filesData } = this.state;

    const content = fs.readFileSync(filesData[index].path).toString();

    this.setState({
      loadedFile: content,
      activeIndex: index,
    });
  };

  changeFile = index => () => {
    const { activeIndex } = this.state;
    if (index !== activeIndex) {
      this.saveFile();
      this.loadFile(index);
    }
  };

  saveFile = () => {
    const { activeIndex, loadedFile, filesData } = this.state;
    fs.writeFile(filesData[activeIndex].path, loadedFile, err => {
      if (err) return console.log(err);
      console.log('saved ');
    });
  };

  newFile = e => {
    e.preventDefault();
    console.log('add new file');
    const { newEntryName, dir, filesData } = this.state;
    const fileDate = dateFns.format(new Date(), 'MM-DD-YYYY');
    const filePath = `${dir}/${newEntryName}_${fileDate}.md`;
    fs.writeFile(filePath, '', err => {
      if (err) return console.log(err);
      filesData.unshift({
        path: filePath,
        date: fileDate,
        title: newEntryName,
      });
      this.setState({
        newEntry: false,
        newEntryName: '',
        loadedFile: '',
        filesData,
      });
    });
  };

  render() {
    const {
      activeIndex,
      filesData,
      dir,
      loadedFile,
      newEntry,
      newEntryName,
    } = this.state;
    return (
      <AppWrapper>
        <Header>Bullet Journal</Header>
        {dir ? (
          <Split>
            <FilesWindow>
              <Button onClick={() => this.setState({ newEntry: !newEntry })}>
                + New Entry
              </Button>
              {newEntry && (
                <form onSubmit={this.newFile}>
                  <input
                    autoFocus
                    type="text"
                    value={newEntryName}
                    onChange={e =>
                      this.setState({ newEntryName: e.target.value })
                    }
                  />
                </form>
              )}
              {filesData.map((file, index) => (
                <FileButton
                  active={activeIndex === index}
                  onClick={this.changeFile(index)}
                >
                  <p className="title">{file.title}</p>
                  <p className="date">{formatDate(file.date)}</p>
                </FileButton>
              ))}
            </FilesWindow>
            <CodeWindow>
              <AceEditor
                mode="markdown"
                theme="dracula"
                onChange={newContent => {
                  this.setState({ loadedFile: newContent });
                }}
                name="markdown_editor"
                value={loadedFile}
              />
            </CodeWindow>
            <RenderedWindow>
              <Markdown>{loadedFile}</Markdown>
            </RenderedWindow>
          </Split>
        ) : (
          <OpenDirectoryMessage>
            <h1>Open directory</h1>
          </OpenDirectoryMessage>
        )}
      </AppWrapper>
    );
  }
}

export default App;

const AppWrapper = styled.div`
  margin-top: 23px;
`;

const OpenDirectoryMessage = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
`;

const Header = styled.header`
  background-color: #191324;
  color: #75717c;
  font-size: 0.8rem;
  height: 23px;
  text-align: center;
  position: fixed;
  box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.2);
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  -webkit-app-region: drag;
`;

const Split = styled.div`
  display: flex;
  height: 100vh;
`;

const FilesWindow = styled.div`
  background-color: #140f1d;
  border-right: solid 1px #302b3a;
  position: relative;
  width: 20%;

  &:after {
    content: '';
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    pointer-events: none;
    box-shadow: -10px 0 20px rgba(0, 0, 0, 0.3) inset;
  }
`;

const CodeWindow = styled.div`
  flex: 1;
  padding-top: 2rem;
  background-color: #191324;
`;

const RenderedWindow = styled.div`
  background-color: #191324;
  width: 35%;
  padding: 20px;
  color: #fff;
  border-left: 1px solid #302b3a;
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: #82d8d8;
  }
  h1 {
    border-bottom: solid 3px #e54b4b;
    padding-bottom: 10px;
  }
  a {
    color: #e54b4b;
  }
`;

const FileButton = styled.button`
  padding: 10px;
  width: 100%;
  text-align: left;
  background: #191324;
  opacity: 0.4;
  color: white;
  border: none;
  border-bottom: solid 1px #302b3a;
  transition: 0.3x ease all;

  .title {
    font-weight: bold;
    margin: 0 0 5px;
  }

  .date {
    margin: 0;
  }

  &:hover {
    opacity: 1;
    border-left: solid 4px white;
  }

  ${({ active }) =>
    active &&
    ` opacity: 1;
    border-left: solid 4px white;`};
`;

const Button = styled.button`
  display: block;
  background: transparent;
  color: white;
  border: solid 1px white;
  border-radius: 4px;
  margin: 1rem auto;
  font-size: 1rem;
  transition: 0.3 ease all;

  &:hover {
    color: lightgray;
  }
`;

const formatDate = date => dateFns.format(new Date(date), 'MMMM Do YYYY');
