window.onload = function() {
    // Fetch all students
    fetch('/list')
        .then(response => response.json())
        .then(data => {
            let list = document.getElementById('studentsList');
            data.students.forEach(student => {
                let item = document.createElement('div');
                item.textContent = `Name: ${student.name}, Age: ${student.age}, ID: ${student.id}, Score: ${student.score}`;
                list.appendChild(item);
            });
        })
        .catch(error => console.error(error));

    // Add event listeners to forms
    document.getElementById('addForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('editForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('deleteForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('viewForm').addEventListener('submit', handleFormSubmit);
};

function handleFormSubmit(event) {
    event.preventDefault();

    let form = event.target;
    let url = form.action;
    let method = form.method;
    let data = new FormData(form);

    fetch(url, {
            method: method,
            body: data
        })
        .then(response => response.json())
        .then(data => {
            let status = document.getElementById('status');
            if (url.endsWith('/add')) {
                status.textContent = 'Student has been added successfully.';
            } else if (url.endsWith('/edit')) {
                status.textContent = 'Student has been edited successfully.';
            } else if (url.endsWith('/delete')) {
                status.textContent = 'Student has been deleted successfully.';
            } else if (url.endsWith('/view')) {
                let details = document.getElementById('studentDetails');
                details.innerHTML = '';
                for (let key in data) {
                    let item = document.createElement('div');
                    item.textContent = `${key}: ${data[key]}`;
                    details.appendChild(item);
                }
                status.textContent = 'Student details have been fetched successfully.';
            }
            // Refresh the page to update the students list
            setTimeout(() => location.reload(), 2000);
        })
        .catch(error => console.error(error));
}