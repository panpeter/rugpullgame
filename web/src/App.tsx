import React from 'react';
import {BrowserRouter as Router, Route, Routes,} from 'react-router-dom';
import {Main} from "./features/main/Main";
import {Game} from "./features/game/Game";
import {Footer} from "./features/main/Footer";

function App() {
    return (
        <Router>
            <main>
                <Routes>
                    <Route
                        path="/0x1173e34634f1F42253D8248C3d90CAc40466cf29"
                        element={<Game contractAddress={"0x1173e34634f1F42253D8248C3d90CAc40466cf29"}/>}
                    />
                    <Route index element={<Main/>}/>
                </Routes>
            </main>
            <Footer/>
        </Router>
    );
}

export default App;
