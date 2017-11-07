// Firebase binding
const stateNamespaces = new WeakMap()

export function FirestoreBinding (unsubscriber) {
  this.unbind = unsubscriber
}

export function RTDBBinding (source) {
  this.listeners = {}
  this.unbind = () => {
    for (let event in this.listeners) {
      source.off(event, this.listeners[event])
    }
  }
  this.addListeners = (listeners) => {
    Object.assign(this.listeners, listeners)
  }
}

function BindingDictionary () {
  this.add = ({ commit, key, binding }) => {
    this.delete({ commit, key })
    const stateNamespace = this.get({ commit })
    stateNamespace[key] = binding
  }

  this.delete = ({commit, key}) => {
    const stateNamespace = this.get({ commit })
    const binding = stateNamespace[key]
    if (binding) {
      binding.unbind()
      delete stateNamespace[key]
    }
  }

  this.get = ({ commit }) => {
    var stateNamespace = stateNamespaces.get(commit)
    if (!stateNamespace) {
      stateNamespace = Object.create(null)
      stateNamespaces.set(commit, stateNamespace)
    }

    return stateNamespace
  }
}

export const bindings = new BindingDictionary()
